/**
 * Sync Shareholders to Blockchain Script
 * 
 * This script reads all active shareholders from the database
 * and adds them to the smart contract.
 * 
 * Run: npm run db:sync-blockchain
 * Or:  npx ts-node prisma/sync-to-blockchain.ts
 */

import { PrismaClient } from '@prisma/client';
import { ethers, Contract, Wallet, JsonRpcProvider } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Voting contract ABI (just the functions we need)
const VotingABI = [
  "function getAdmin() view returns (address)",
  "function addShareholder(address _shareholder, uint256 _shares)",
  "function getShares(address _shareholder) view returns (uint256)",
  "event ShareholderAdded(address indexed shareholder, uint256 shares)"
];

async function main() {
  console.log("\n🔄 Syncing Shareholders to Blockchain...\n");

  // Check environment variables
  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;

  if (!contractAddress) {
    console.error("❌ CONTRACT_ADDRESS not set in .env");
    process.exit(1);
  }

  if (!adminPrivateKey) {
    console.error("❌ ADMIN_PRIVATE_KEY not set in .env");
    console.log("\n💡 For local Hardhat, use:");
    console.log("   ADMIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
    process.exit(1);
  }

  // Connect to blockchain
  console.log(`📡 Connecting to: ${rpcUrl}`);
  const provider = new JsonRpcProvider(rpcUrl);
  const signer = new Wallet(adminPrivateKey, provider);
  const contract = new Contract(contractAddress, VotingABI, signer);

  console.log(`📝 Contract: ${contractAddress}`);
  console.log(`🔑 Signer: ${signer.address}`);

  // Verify admin
  try {
    const contractAdmin = await contract.getAdmin();
    console.log(`👑 Contract Admin: ${contractAdmin}`);

    if (contractAdmin.toLowerCase() !== signer.address.toLowerCase()) {
      console.error("\n❌ ERROR: Your ADMIN_PRIVATE_KEY does not match the contract admin!");
      console.error(`   Expected: ${contractAdmin}`);
      console.error(`   Got:      ${signer.address}`);
      console.error("\n💡 Fix your .env file to use the correct private key.");
      process.exit(1);
    }

    console.log("✅ Admin verified!\n");
  } catch (error: any) {
    console.error("❌ Failed to connect to contract:", error.message);
    console.log("   Make sure Hardhat node is running and contract is deployed.");
    process.exit(1);
  }

  // Get all active shareholders from database
  const shareholders = await prisma.shareholder.findMany({
    where: { isActive: true },
    include: { shares: true },
  });

  console.log(`📋 Found ${shareholders.length} active shareholders in database:\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const sh of shareholders) {
    const shares = sh.shares?.shares || 0;
    console.log(`   ${sh.name} (${sh.walletAddress})`);
    console.log(`      Database shares: ${shares}`);

    if (shares <= 0) {
      console.log(`      ⏭️  Skipped (0 shares)\n`);
      skipCount++;
      continue;
    }

    // Check current blockchain shares
    try {
      const currentShares = await contract.getShares(sh.walletAddress);
      console.log(`      Blockchain shares: ${currentShares}`);

      if (currentShares > 0n) {
        if (BigInt(shares) === currentShares) {
          console.log(`      ✅ Already synced!\n`);
          skipCount++;
          continue;
        } else {
          console.log(`      🔄 Updating shares...`);
        }
      } else {
        console.log(`      ➕ Adding to blockchain...`);
      }

      // Add/update shareholder on blockchain
      // Get the current nonce to ensure proper sequencing
      const nonce = await provider.getTransactionCount(signer.address, 'pending');
      const tx = await contract.addShareholder(sh.walletAddress, shares, { nonce });
      await tx.wait();
      console.log(`      ✅ Done! TX: ${tx.hash}\n`);
      successCount++;
      
      // Wait a bit for nonce to update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Also fund the wallet with some ETH for gas
      try {
        const balance = await provider.getBalance(sh.walletAddress);
        if (balance < ethers.parseEther("1")) {
          console.log(`      💰 Funding wallet with 10 ETH...`);
          const fundNonce = await provider.getTransactionCount(signer.address, 'pending');
          const fundTx = await signer.sendTransaction({
            to: sh.walletAddress,
            value: ethers.parseEther("10"),
            nonce: fundNonce
          });
          await fundTx.wait();
          console.log(`      ✅ Funded!\n`);
          // Wait a bit for nonce to update
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (fundError: any) {
        console.log(`      ⚠️  Could not fund wallet: ${fundError.message}\n`);
      }

    } catch (error: any) {
      console.log(`      ❌ Failed: ${error.message}\n`);
      errorCount++;
    }
  }

  console.log("\n" + "─".repeat(50));
  console.log("📊 Summary:");
  console.log(`   ✅ Successfully synced: ${successCount}`);
  console.log(`   ⏭️  Skipped (already synced or 0 shares): ${skipCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log("─".repeat(50) + "\n");

  if (successCount > 0) {
    console.log("🎉 Shareholders are now synced to the blockchain!");
    console.log("   They can now vote on proposals.\n");
  }
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

