/**
 * Fund all shareholder wallets with ETH for gas
 */
const hre = require("hardhat");

async function main() {
  const [admin] = await hre.ethers.getSigners();
  
  const wallets = [
    { name: "test1", address: "0xc674A160eD6780d2260f3B5b509b34Bf87D7dB67" },
    { name: "test2", address: "0xe8D64006562E9B9e6107075b2263Efa1EBC4A97E" },
    { name: "test3", address: "0x885D31D2C25cfd5013b95cd7856589e43326E6Ab" },
  ];

  console.log("\n💰 Funding shareholder wallets with 10 ETH each...\n");

  for (const wallet of wallets) {
    try {
      const tx = await admin.sendTransaction({
        to: wallet.address,
        value: hre.ethers.parseEther("10")
      });
      await tx.wait();
      console.log(`   ✅ ${wallet.name}: Funded with 10 ETH`);
    } catch (e) {
      console.log(`   ❌ ${wallet.name}: ${e.message}`);
    }
  }
  
  console.log("\n🎉 Done!\n");
}

main().catch(console.error);






