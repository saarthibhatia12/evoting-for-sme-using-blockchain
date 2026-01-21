const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting - Tie Resolution", function () {
  let voting;
  let admin, voter1, voter2;

  beforeEach(async function () {
    [admin, voter1, voter2] = await ethers.getSigners();

    // Deploy the contract
    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy();
    await voting.waitForDeployment();

    // Add shareholders with equal shares
    await voting.addShareholder(voter1.address, 50);
    await voting.addShareholder(voter2.address, 50);

    // Create a proposal that starts immediately and ends in 1 hour
    const currentBlock = await ethers.provider.getBlock("latest");
    const startTime = currentBlock.timestamp;
    const endTime = startTime + 3600; // 1 hour from now
    await voting.createProposal("Test Proposal", startTime, endTime);
  });

  describe("resolveTie function", function () {
    it("Should prevent resolving tie while voting is still open", async function () {
      // Try to resolve tie while voting is open
      await expect(
        voting.resolveTie(1, "STATUS_QUO_REJECT")
      ).to.be.revertedWith("Voting must be closed to resolve tie");
    });

    it("Should prevent resolving non-tied proposal", async function () {
      // Vote YES with voter1 (not tied: 50 YES, 0 NO)
      await voting.connect(voter1).vote(1, true);

      // Fast forward time to close voting
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      // Now try to resolve (should fail - not tied)
      await expect(
        voting.resolveTie(1, "STATUS_QUO_REJECT")
      ).to.be.revertedWith("Proposal is not tied");
    });

    it("Should successfully resolve tied proposal with STATUS_QUO_REJECT", async function () {
      // Vote to create a tie
      await voting.connect(voter1).vote(1, true); // 50 YES
      await voting.connect(voter2).vote(1, false); // 50 NO

      // Fast forward time to close voting
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      // Resolve the tie
      await expect(voting.resolveTie(1, "STATUS_QUO_REJECT"))
        .to.emit(voting, "TieResolved")
        .withArgs(1, "STATUS_QUO_REJECT");

      // Verify resolution was recorded
      const resolution = await voting.getTieResolution(1);
      expect(resolution).to.equal("STATUS_QUO_REJECT");
    });

    it("Should successfully resolve tied proposal with CHAIRPERSON_YES", async function () {
      // Vote to create a tie
      await voting.connect(voter1).vote(1, true); // 50 YES
      await voting.connect(voter2).vote(1, false); // 50 NO

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      // Resolve with CHAIRPERSON_YES
      await expect(voting.resolveTie(1, "CHAIRPERSON_YES"))
        .to.emit(voting, "TieResolved")
        .withArgs(1, "CHAIRPERSON_YES");

      const resolution = await voting.getTieResolution(1);
      expect(resolution).to.equal("CHAIRPERSON_YES");
    });

    it("Should successfully resolve tied proposal with CHAIRPERSON_NO", async function () {
      // Vote to create a tie
      await voting.connect(voter1).vote(1, true); // 50 YES
      await voting.connect(voter2).vote(1, false); // 50 NO

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      // Resolve with CHAIRPERSON_NO
      await expect(voting.resolveTie(1, "CHAIRPERSON_NO"))
        .to.emit(voting, "TieResolved")
        .withArgs(1, "CHAIRPERSON_NO");

      const resolution = await voting.getTieResolution(1);
      expect(resolution).to.equal("CHAIRPERSON_NO");
    });

    it("Should reject invalid resolution type", async function () {
      // Vote to create a tie
      await voting.connect(voter1).vote(1, true);
      await voting.connect(voter2).vote(1, false);

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      // Try to resolve with invalid type
      await expect(
        voting.resolveTie(1, "INVALID_TYPE")
      ).to.be.revertedWith("Invalid resolution type");
    });

    it("Should prevent resolving same tie twice", async function () {
      // Vote to create a tie
      await voting.connect(voter1).vote(1, true);
      await voting.connect(voter2).vote(1, false);

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      // Resolve once
      await voting.resolveTie(1, "STATUS_QUO_REJECT");

      // Try to resolve again
      await expect(
        voting.resolveTie(1, "CHAIRPERSON_YES")
      ).to.be.revertedWith("Tie already resolved");
    });

    it("Should only allow admin to resolve tie", async function () {
      // Vote to create a tie
      await voting.connect(voter1).vote(1, true);
      await voting.connect(voter2).vote(1, false);

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      // Non-admin tries to resolve
      await expect(
        voting.connect(voter1).resolveTie(1, "STATUS_QUO_REJECT")
      ).to.be.revertedWith("Only admin can call this function");
    });

    it("Should return empty string for unresolved tie", async function () {
      const resolution = await voting.getTieResolution(1);
      expect(resolution).to.equal("");
    });
  });
});
