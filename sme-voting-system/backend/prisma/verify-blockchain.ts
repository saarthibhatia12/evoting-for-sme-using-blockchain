/**
 * Verify Shareholders on Blockchain Script
 * 
 * Dynamically fetches ALL shareholders from the database
 * and verifies they are registered on the smart contract.
 * 
 * Run: npm run db:verify-blockchain
 * Or:  npx ts-node prisma/verify-blockchain.ts
 */

import { PrismaClient } from '@prisma/client';
import { Contract, JsonRpcProvider } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Voting contract ABI (just the functions we need)
const VotingABI = [
  "function getAdmin() view returns (address)",
  "function getShares(address _shareholder) view returns (uint256)",
  "function proposalCount() view returns (uint256)",
];

async function main() {
  console.log("\n🔍 Verifying Shareholders: Database vs Blockchain\n");

  // Check environment variables
  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!contractAddress) {
    console.error("❌ CONTRACT_ADDRESS not set in .env");
    process.exit(1);
  }

  // Connect to blockchain
  console.log(`📡 Blockchain: ${rpcUrl}`);
  console.log(`📝 Contract: ${contractAddress}\n`);

  let provider: JsonRpcProvider;
  let contract: Contract;

  try {
    provider = new JsonRpcProvider(rpcUrl);
    contract = new Contract(contractAddress, VotingABI, provider);

    // Verify connection
    const admin = await contract.getAdmin();
    console.log(`👑 Contract Admin: ${admin}`);
    
    const proposalCount = await contract.proposalCount();
    console.log(`📊 Total Proposals: ${proposalCount}\n`);
  } catch (error: any) {
    console.error("❌ Failed to connect to blockchain:", error.message);
    console.log("   Make sure Hardhat node is running and contract is deployed.");
    process.exit(1);
  }

  // Get all shareholders from database
  const shareholders = await prisma.shareholder.findMany({
    where: { isActive: true },
    include: { shares: true },
    orderBy: { createdAt: 'asc' },
  });

  if (shareholders.length === 0) {
    console.log("📋 No active shareholders found in database.\n");
    return;
  }

  console.log(`📋 Found ${shareholders.length} active shareholders in database:\n`);
  console.log("─".repeat(80));
  console.log(
    "Name".padEnd(20) +
    "Wallet Address".padEnd(45) +
    "DB Shares".padEnd(12) +
    "Blockchain"
  );
  console.log("─".repeat(80));

  let syncedCount = 0;
  let mismatchCount = 0;
  let notRegisteredCount = 0;

  for (const sh of shareholders) {
    const dbShares = sh.shares?.shares || 0;
    let blockchainShares = 0n;
    let status = "";

    try {
      blockchainShares = await contract.getShares(sh.walletAddress);

      if (blockchainShares === 0n) {
        status = "❌ NOT REGISTERED";
        notRegisteredCount++;
      } else if (BigInt(dbShares) === blockchainShares) {
        status = "✅ Synced";
        syncedCount++;
      } else {
        status = `⚠️ MISMATCH (${blockchainShares})`;
        mismatchCount++;
      }
    } catch (error) {
      status = "❌ ERROR";
      notRegisteredCount++;
    }

    // Truncate name if too long
    const displayName = sh.name.length > 18 ? sh.name.substring(0, 15) + "..." : sh.name;
    
    console.log(
      displayName.padEnd(20) +
      sh.walletAddress.padEnd(45) +
      String(dbShares).padEnd(12) +
      status
    );
  }

  console.log("─".repeat(80));

  // Summary
  console.log("\n📊 Summary:");
  console.log(`   ✅ Synced:          ${syncedCount}`);
  console.log(`   ⚠️  Mismatched:      ${mismatchCount}`);
  console.log(`   ❌ Not Registered:  ${notRegisteredCount}`);
  console.log(`   📋 Total:           ${shareholders.length}`);

  if (notRegisteredCount > 0 || mismatchCount > 0) {
    console.log("\n💡 To fix, run: npm run db:sync-blockchain");
  } else {
    console.log("\n🎉 All shareholders are properly synced!");
  }

  console.log("");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

