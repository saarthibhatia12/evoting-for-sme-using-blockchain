const hre = require("hardhat");

async function main() {
  console.log("=".repeat(60));
  console.log("  SME Voting System - Smart Contract Deployment");
  console.log("=".repeat(60));
  console.log("");

  // ============================================================
  // 1. Deploy the Voting contract (Simple Voting)
  // ============================================================
  console.log("[1/2] Deploying Voting contract (Simple Voting)...");
  
  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();
  await voting.waitForDeployment();
  
  const votingAddress = await voting.getAddress();
  console.log(`  ✅ Voting contract deployed to: ${votingAddress}`);
  console.log("");

  // ============================================================
  // 2. Deploy the QuadraticVoting contract
  // ============================================================
  console.log("[2/2] Deploying QuadraticVoting contract...");
  
  const QuadraticVoting = await hre.ethers.getContractFactory("QuadraticVoting");
  const quadraticVoting = await QuadraticVoting.deploy();
  await quadraticVoting.waitForDeployment();
  
  const quadraticAddress = await quadraticVoting.getAddress();
  console.log(`  ✅ QuadraticVoting contract deployed to: ${quadraticAddress}`);
  console.log("");

  // ============================================================
  // Summary
  // ============================================================
  console.log("=".repeat(60));
  console.log("  Deployment Complete!");
  console.log("=".repeat(60));
  console.log("");
  console.log("📋 Add these to your backend .env file:");
  console.log("-".repeat(60));
  console.log(`CONTRACT_ADDRESS=${votingAddress}`);
  console.log(`QUADRATIC_CONTRACT_ADDRESS=${quadraticAddress}`);
  console.log("-".repeat(60));
  console.log("");
  console.log("🔗 Contract Addresses Summary:");
  console.log(`  • Voting (Simple):     ${votingAddress}`);
  console.log(`  • QuadraticVoting:     ${quadraticAddress}`);
  console.log("");

  // Return addresses for programmatic use
  return {
    voting: votingAddress,
    quadraticVoting: quadraticAddress
  };
}

main().catch((error) => {
  console.error("❌ Deployment failed:");
  console.error(error);
  process.exitCode = 1;
});
