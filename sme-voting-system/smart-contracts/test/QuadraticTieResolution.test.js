const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("QuadraticVoting - Tie Resolution", function () {
  let quadraticVoting;
  let admin, voter1, voter2;
  const BASE_TOKENS = 100;

  beforeEach(async function () {
    [admin, voter1, voter2] = await ethers.getSigners();

    // Deploy the contract
    const QuadraticVoting = await ethers.getContractFactory("QuadraticVoting");
    quadraticVoting = await QuadraticVoting.deploy();
    await quadraticVoting.waitForDeployment();

    // Add shareholders with equal shares
    await quadraticVoting.addShareholder(voter1.address, 50);
    await quadraticVoting.addShareholder(voter2.address, 50);

    // Create a quadratic proposal
    const currentBlock = await ethers.provider.getBlock("latest");
    const startTime = currentBlock.timestamp;
    const endTime = startTime + 3600; // 1 hour from now
    await quadraticVoting.createQuadraticProposal("Test Quadratic Proposal", startTime, endTime, BASE_TOKENS);

    // Initialize tokens for both voters (100 tokens each)
    await quadraticVoting.initializeVoterTokens(1, voter1.address, BASE_TOKENS);
    await quadraticVoting.initializeVoterTokens(1, voter2.address, BASE_TOKENS);
  });

  describe("resolveTie function for Quadratic Voting", function () {
    it("Should prevent resolving tie while voting is still open", async function () {
      // Try to resolve tie while voting is open
      await expect(
        quadraticVoting.resolveTie(1, "STATUS_QUO_REJECT")
      ).to.be.revertedWith("Voting must be closed to resolve tie");
    });

    it("Should prevent resolving non-tied quadratic proposal", async function () {
      // Vote YES with voter1 only (creates non-tie)
      // 5 YES votes costs 25 tokens (5²)
      await quadraticVoting.connect(voter1).castQuadraticVote(1, true, 5);

      // Fast forward time to close voting
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      // Now try to resolve (should fail - not tied)
      await expect(
        quadraticVoting.resolveTie(1, "STATUS_QUO_REJECT")
      ).to.be.revertedWith("Proposal is not tied");
    });

    it("Should successfully resolve tied quadratic proposal with STATUS_QUO_REJECT", async function () {
      // Create a tie: both vote 5 times
      // voter1: 5 YES votes (25 tokens)
      await quadraticVoting.connect(voter1).castQuadraticVote(1, true, 5);
      
      // voter2: 5 NO votes (25 tokens)
      await quadraticVoting.connect(voter2).castQuadraticVote(1, false, 5);

      // Fast forward time to close voting
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      // Resolve the tie
      await expect(quadraticVoting.resolveTie(1, "STATUS_QUO_REJECT"))
        .to.emit(quadraticVoting, "TieResolved")
        .withArgs(1, "STATUS_QUO_REJECT");

      // Verify resolution was recorded
      const resolution = await quadraticVoting.getTieResolution(1);
      expect(resolution).to.equal("STATUS_QUO_REJECT");
    });

    it("Should successfully resolve tied quadratic proposal with CHAIRPERSON_YES", async function () {
      // Create a tie
      await quadraticVoting.connect(voter1).castQuadraticVote(1, true, 3); // 3 YES votes (9 tokens)
      await quadraticVoting.connect(voter2).castQuadraticVote(1, false, 3); // 3 NO votes (9 tokens)

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      // Resolve with CHAIRPERSON_YES
      await expect(quadraticVoting.resolveTie(1, "CHAIRPERSON_YES"))
        .to.emit(quadraticVoting, "TieResolved")
        .withArgs(1, "CHAIRPERSON_YES");

      const resolution = await quadraticVoting.getTieResolution(1);
      expect(resolution).to.equal("CHAIRPERSON_YES");
    });

    it("Should successfully resolve tied quadratic proposal with CHAIRPERSON_NO", async function () {
      // Create a tie
      await quadraticVoting.connect(voter1).castQuadraticVote(1, true, 7); // 7 YES votes (49 tokens)
      await quadraticVoting.connect(voter2).castQuadraticVote(1, false, 7); // 7 NO votes (49 tokens)

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      // Resolve with CHAIRPERSON_NO
      await expect(quadraticVoting.resolveTie(1, "CHAIRPERSON_NO"))
        .to.emit(quadraticVoting, "TieResolved")
        .withArgs(1, "CHAIRPERSON_NO");

      const resolution = await quadraticVoting.getTieResolution(1);
      expect(resolution).to.equal("CHAIRPERSON_NO");
    });

    it("Should reject invalid resolution type", async function () {
      // Create a tie
      await quadraticVoting.connect(voter1).castQuadraticVote(1, true, 4);
      await quadraticVoting.connect(voter2).castQuadraticVote(1, false, 4);

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      // Try to resolve with invalid type
      await expect(
        quadraticVoting.resolveTie(1, "INVALID_TYPE")
      ).to.be.revertedWith("Invalid resolution type");
    });

    it("Should prevent resolving same tie twice", async function () {
      // Create a tie
      await quadraticVoting.connect(voter1).castQuadraticVote(1, true, 6);
      await quadraticVoting.connect(voter2).castQuadraticVote(1, false, 6);

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      // Resolve once
      await quadraticVoting.resolveTie(1, "STATUS_QUO_REJECT");

      // Try to resolve again
      await expect(
        quadraticVoting.resolveTie(1, "CHAIRPERSON_YES")
      ).to.be.revertedWith("Tie already resolved");
    });

    it("Should only allow admin to resolve tie", async function () {
      // Create a tie
      await quadraticVoting.connect(voter1).castQuadraticVote(1, true, 8);
      await quadraticVoting.connect(voter2).castQuadraticVote(1, false, 8);

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      // Non-admin tries to resolve
      await expect(
        quadraticVoting.connect(voter1).resolveTie(1, "STATUS_QUO_REJECT")
      ).to.be.revertedWith("Only admin can call this function");
    });

    it("Should return empty string for unresolved tie", async function () {
      const resolution = await quadraticVoting.getTieResolution(1);
      expect(resolution).to.equal("");
    });

    it("Should handle tie with different vote counts but same result", async function () {
      // voter1: 10 YES votes (100 tokens - uses all)
      await quadraticVoting.connect(voter1).castQuadraticVote(1, true, 10);
      
      // voter2: 10 NO votes (100 tokens - uses all)
      await quadraticVoting.connect(voter2).castQuadraticVote(1, false, 10);

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      // Should be tied at 10-10
      const result = await quadraticVoting.getProposalResult(1);
      expect(result.yesVotes).to.equal(10);
      expect(result.noVotes).to.equal(10);

      // Resolve the tie
      await expect(quadraticVoting.resolveTie(1, "CHAIRPERSON_YES"))
        .to.emit(quadraticVoting, "TieResolved")
        .withArgs(1, "CHAIRPERSON_YES");
    });
  });
});
