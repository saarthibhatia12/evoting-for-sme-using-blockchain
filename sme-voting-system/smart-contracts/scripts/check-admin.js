/**
 * Diagnostic Script: Check Smart Contract Admin Configuration
 * 
 * This script verifies that the smart contract admin matches
 * the expected configuration for blockchain transactions.
 * 
 * Run: npx hardhat run scripts/check-admin.js --network localhost
 * 
 * For shareholder verification, use the backend script:
 *   cd ../backend && npm run db:verify-blockchain
 */

const hre = require("hardhat");

async function main() {
  console.log("\n🔍 Smart Contract Admin Check\n");

  // Get the deployed contract
  const contractAddress = process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  console.log(`📝 Contract Address: ${contractAddress}`);
  
  try {
    const Voting = await hre.ethers.getContractFactory("Voting");
    const voting = Voting.attach(contractAddress);

    // Get the admin from the smart contract
    const contractAdmin = await voting.getAdmin();
    console.log(`👑 Smart Contract Admin: ${contractAdmin}`);

    // Get current signer (who would execute transactions from Hardhat)
    const [signer] = await hre.ethers.getSigners();
    console.log(`📍 Hardhat Signer: ${signer.address}`);

    // Get proposal count
    const proposalCount = await voting.proposalCount();
    console.log(`📊 Total Proposals: ${proposalCount}`);

    // Check if Hardhat signer matches contract admin
    console.log("\n─────────────────────────────────────────");
    if (contractAdmin.toLowerCase() === signer.address.toLowerCase()) {
      console.log("✅ Hardhat signer IS the contract admin");
      console.log("   Transactions from Hardhat will work.");
    } else {
      console.log("❌ Hardhat signer is NOT the contract admin");
      console.log("   Transactions from Hardhat will be rejected.");
    }
    console.log("─────────────────────────────────────────");

    // Show recommended .env configuration
    console.log("\n📋 Recommended backend .env configuration:");
    console.log("   ─────────────────────────────────────────");
    console.log(`   CONTRACT_ADDRESS=${contractAddress}`);
    console.log(`   ADMIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`);
    console.log(`   ADMIN_WALLET_ADDRESS=${contractAdmin}`);
    console.log("   ─────────────────────────────────────────");

    console.log("\n💡 To verify shareholders, run:");
    console.log("   cd ../backend && npm run db:verify-blockchain\n");

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.log("\n⚠️  Make sure:");
    console.log("   1. Hardhat node is running (npx hardhat node)");
    console.log("   2. Contract is deployed (npx hardhat run scripts/deploy.js --network localhost)");
    console.log("");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
