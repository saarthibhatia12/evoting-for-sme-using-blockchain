const hre = require("hardhat");

async function main() {
  console.log("Deploying Voting contract...");

  // Deploy the Voting contract
  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();

  await voting.waitForDeployment();

  const address = await voting.getAddress();
  console.log(`✅ Voting contract deployed to: ${address}`);
  console.log(`\n📋 Add this to your backend .env file:`);
  console.log(`CONTRACT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
