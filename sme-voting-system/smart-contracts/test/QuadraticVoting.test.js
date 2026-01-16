const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("QuadraticVoting", function () {
  let quadraticVoting;
  let admin, voter1, voter2, voter3, nonShareholder;

  // Helper to create timestamps
  const getTimestamps = async (startOffset = 0, durationHours = 24) => {
    const currentTime = await time.latest();
    return {
      startTime: currentTime + startOffset,
      endTime: currentTime + startOffset + (durationHours * 3600)
    };
  };

  beforeEach(async function () {
    [admin, voter1, voter2, voter3, nonShareholder] = await ethers.getSigners();

    const QuadraticVoting = await ethers.getContractFactory("QuadraticVoting");
    quadraticVoting = await QuadraticVoting.deploy();
    await quadraticVoting.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the deployer as admin", async function () {
      expect(await quadraticVoting.getAdmin()).to.equal(admin.address);
    });

    it("Should emit ContractDeployed event", async function () {
      const QuadraticVoting = await ethers.getContractFactory("QuadraticVoting");
      const tx = await QuadraticVoting.deploy();
      await expect(tx.deploymentTransaction())
        .to.emit(tx, "ContractDeployed");
    });
  });

  describe("Shareholder Management", function () {
    it("Should allow admin to add shareholders", async function () {
      await quadraticVoting.addShareholder(voter1.address, 100);
      expect(await quadraticVoting.getShares(voter1.address)).to.equal(100);
    });

    it("Should emit ShareholderAdded event", async function () {
      await expect(quadraticVoting.addShareholder(voter1.address, 100))
        .to.emit(quadraticVoting, "ShareholderAdded")
        .withArgs(voter1.address, 100);
    });

    it("Should reject non-admin from adding shareholders", async function () {
      await expect(
        quadraticVoting.connect(voter1).addShareholder(voter2.address, 100)
      ).to.be.revertedWith("Only admin can call this function");
    });

    it("Should correctly identify shareholders", async function () {
      await quadraticVoting.addShareholder(voter1.address, 100);
      expect(await quadraticVoting.isShareholder(voter1.address)).to.be.true;
      expect(await quadraticVoting.isShareholder(voter2.address)).to.be.false;
    });
  });

  describe("Proposal Creation", function () {
    it("Should create a quadratic proposal with default base tokens", async function () {
      const { startTime, endTime } = await getTimestamps(60);
      
      await quadraticVoting.createQuadraticProposal(
        "Test Proposal",
        startTime,
        endTime,
        0 // 0 should default to 100
      );

      const proposal = await quadraticVoting.getProposal(1);
      expect(proposal.title).to.equal("Test Proposal");
      expect(proposal.baseTokens).to.equal(100); // Default
      expect(proposal.exists).to.be.true;
    });

    it("Should create a quadratic proposal with custom base tokens", async function () {
      const { startTime, endTime } = await getTimestamps(60);
      
      await quadraticVoting.createQuadraticProposal(
        "Custom Token Proposal",
        startTime,
        endTime,
        200 // Custom base tokens
      );

      const proposal = await quadraticVoting.getProposal(1);
      expect(proposal.baseTokens).to.equal(200);
    });

    it("Should emit QuadraticProposalCreated event", async function () {
      const { startTime, endTime } = await getTimestamps(60);
      
      await expect(quadraticVoting.createQuadraticProposal(
        "Test Proposal",
        startTime,
        endTime,
        100
      ))
        .to.emit(quadraticVoting, "QuadraticProposalCreated")
        .withArgs(1, "Test Proposal", startTime, endTime, 100);
    });

    it("Should reject proposal with empty title", async function () {
      const { startTime, endTime } = await getTimestamps(60);
      
      await expect(
        quadraticVoting.createQuadraticProposal("", startTime, endTime, 100)
      ).to.be.revertedWith("Title cannot be empty");
    });

    it("Should reject proposal with invalid time range", async function () {
      const { startTime, endTime } = await getTimestamps(60);
      
      await expect(
        quadraticVoting.createQuadraticProposal("Test", endTime, startTime, 100)
      ).to.be.revertedWith("Start time must be before end time");
    });

    it("Should increment proposal count", async function () {
      const { startTime, endTime } = await getTimestamps(60);
      
      expect(await quadraticVoting.proposalCount()).to.equal(0);
      await quadraticVoting.createQuadraticProposal("Prop 1", startTime, endTime, 100);
      expect(await quadraticVoting.proposalCount()).to.equal(1);
      await quadraticVoting.createQuadraticProposal("Prop 2", startTime, endTime, 100);
      expect(await quadraticVoting.proposalCount()).to.equal(2);
    });
  });

  describe("Token Initialization", function () {
    let proposalId;

    beforeEach(async function () {
      const { startTime, endTime } = await getTimestamps(60);
      await quadraticVoting.createQuadraticProposal("Test", startTime, endTime, 100);
      proposalId = 1;
    });

    it("Should initialize voter tokens", async function () {
      await quadraticVoting.initializeVoterTokens(proposalId, voter1.address, 50);
      expect(await quadraticVoting.getRemainingTokens(proposalId, voter1.address))
        .to.equal(50);
    });

    it("Should emit VoterTokensInitialized event", async function () {
      await expect(
        quadraticVoting.initializeVoterTokens(proposalId, voter1.address, 50)
      )
        .to.emit(quadraticVoting, "VoterTokensInitialized")
        .withArgs(proposalId, voter1.address, 50);
    });

    it("Should reject duplicate token initialization", async function () {
      await quadraticVoting.initializeVoterTokens(proposalId, voter1.address, 50);
      await expect(
        quadraticVoting.initializeVoterTokens(proposalId, voter1.address, 100)
      ).to.be.revertedWith("Tokens already initialized");
    });

    it("Should batch initialize voter tokens", async function () {
      await quadraticVoting.batchInitializeVoterTokens(
        proposalId,
        [voter1.address, voter2.address, voter3.address],
        [50, 30, 20]
      );

      expect(await quadraticVoting.getRemainingTokens(proposalId, voter1.address)).to.equal(50);
      expect(await quadraticVoting.getRemainingTokens(proposalId, voter2.address)).to.equal(30);
      expect(await quadraticVoting.getRemainingTokens(proposalId, voter3.address)).to.equal(20);
    });

    it("Should reject non-admin from initializing tokens", async function () {
      await expect(
        quadraticVoting.connect(voter1).initializeVoterTokens(proposalId, voter1.address, 50)
      ).to.be.revertedWith("Only admin can call this function");
    });
  });

  describe("Cost Calculation", function () {
    it("Should calculate cost for first vote (0 -> 1): 1 token", async function () {
      expect(await quadraticVoting.calculateVoteCost(0, 1)).to.equal(1);
    });

    it("Should calculate cost for second vote (1 -> 2): 3 tokens", async function () {
      // (1+1)² - 1² = 4 - 1 = 3
      expect(await quadraticVoting.calculateVoteCost(1, 1)).to.equal(3);
    });

    it("Should calculate cost for 3 votes from 0: 9 tokens", async function () {
      // 3² - 0² = 9
      expect(await quadraticVoting.calculateVoteCost(0, 3)).to.equal(9);
    });

    it("Should calculate cost for 2 more votes from 3: 16 tokens", async function () {
      // (3+2)² - 3² = 25 - 9 = 16
      expect(await quadraticVoting.calculateVoteCost(3, 2)).to.equal(16);
    });

    it("Should calculate cost for 5 votes from 0: 25 tokens", async function () {
      // 5² = 25
      expect(await quadraticVoting.calculateVoteCost(0, 5)).to.equal(25);
    });

    it("Should calculate cost for 10 votes from 0: 100 tokens", async function () {
      // 10² = 100
      expect(await quadraticVoting.calculateVoteCost(0, 10)).to.equal(100);
    });
  });

  describe("Quadratic Voting", function () {
    let proposalId;

    beforeEach(async function () {
      // Create proposal starting now
      const { startTime, endTime } = await getTimestamps(0);
      await quadraticVoting.createQuadraticProposal("Test", startTime, endTime, 100);
      proposalId = 1;

      // Initialize tokens
      await quadraticVoting.initializeVoterTokens(proposalId, voter1.address, 50);
      await quadraticVoting.initializeVoterTokens(proposalId, voter2.address, 30);
    });

    it("Should cast first vote correctly", async function () {
      await quadraticVoting.connect(voter1).castQuadraticVote(proposalId, true, 1);

      expect(await quadraticVoting.hasVotedOnProposal(proposalId, voter1.address)).to.be.true;
      expect(await quadraticVoting.getVotesCast(proposalId, voter1.address)).to.equal(1);
      expect(await quadraticVoting.getTokensSpent(proposalId, voter1.address)).to.equal(1);
      expect(await quadraticVoting.getRemainingTokens(proposalId, voter1.address)).to.equal(49);
    });

    it("Should cast multiple votes with quadratic cost", async function () {
      // Cast 3 votes: cost = 9 tokens
      await quadraticVoting.connect(voter1).castQuadraticVote(proposalId, true, 3);

      expect(await quadraticVoting.getVotesCast(proposalId, voter1.address)).to.equal(3);
      expect(await quadraticVoting.getTokensSpent(proposalId, voter1.address)).to.equal(9);
      expect(await quadraticVoting.getRemainingTokens(proposalId, voter1.address)).to.equal(41);
    });

    it("Should allow incremental voting", async function () {
      // First: 2 votes (cost = 4)
      await quadraticVoting.connect(voter1).castQuadraticVote(proposalId, true, 2);
      expect(await quadraticVoting.getTokensSpent(proposalId, voter1.address)).to.equal(4);

      // Second: 1 more vote (cost = 3² - 2² = 5)
      await quadraticVoting.connect(voter1).castQuadraticVote(proposalId, true, 1);
      expect(await quadraticVoting.getTokensSpent(proposalId, voter1.address)).to.equal(9);
      expect(await quadraticVoting.getVotesCast(proposalId, voter1.address)).to.equal(3);
    });

    it("Should lock vote direction after first vote", async function () {
      // Vote YES first
      await quadraticVoting.connect(voter1).castQuadraticVote(proposalId, true, 1);

      // Try to vote NO - should fail
      await expect(
        quadraticVoting.connect(voter1).castQuadraticVote(proposalId, false, 1)
      ).to.be.revertedWith("Cannot change vote direction after first vote");

      // Vote YES again - should work
      await quadraticVoting.connect(voter1).castQuadraticVote(proposalId, true, 1);
    });

    it("Should emit QuadraticVoteCast event with correct data", async function () {
      await expect(
        quadraticVoting.connect(voter1).castQuadraticVote(proposalId, true, 2)
      )
        .to.emit(quadraticVoting, "QuadraticVoteCast")
        .withArgs(proposalId, voter1.address, true, 2, 4, 46);
    });

    it("Should reject vote with insufficient tokens", async function () {
      // voter2 has 30 tokens, 6 votes costs 36
      await expect(
        quadraticVoting.connect(voter2).castQuadraticVote(proposalId, true, 6)
      ).to.be.revertedWith("Insufficient tokens for this many votes");
    });

    it("Should reject vote from uninitialized voter", async function () {
      await expect(
        quadraticVoting.connect(voter3).castQuadraticVote(proposalId, true, 1)
      ).to.be.revertedWith("Voter tokens not initialized");
    });

    it("Should reject vote on non-existent proposal", async function () {
      await expect(
        quadraticVoting.connect(voter1).castQuadraticVote(999, true, 1)
      ).to.be.revertedWith("Proposal does not exist");
    });

    it("Should reject vote when voting is not open", async function () {
      // Create proposal that starts in the future
      const { startTime, endTime } = await getTimestamps(3600);
      await quadraticVoting.createQuadraticProposal("Future", startTime, endTime, 100);
      await quadraticVoting.initializeVoterTokens(2, voter1.address, 50);

      await expect(
        quadraticVoting.connect(voter1).castQuadraticVote(2, true, 1)
      ).to.be.revertedWith("Voting is not open");
    });

    it("Should tally votes correctly from multiple voters", async function () {
      // voter1: 3 YES votes
      await quadraticVoting.connect(voter1).castQuadraticVote(proposalId, true, 3);
      // voter2: 2 NO votes
      await quadraticVoting.connect(voter2).castQuadraticVote(proposalId, false, 2);

      const result = await quadraticVoting.getProposalResult(proposalId);
      expect(result.yesVotes).to.equal(3);
      expect(result.noVotes).to.equal(2);
    });
  });

  describe("Max Affordable Votes", function () {
    let proposalId;

    beforeEach(async function () {
      const { startTime, endTime } = await getTimestamps(0);
      await quadraticVoting.createQuadraticProposal("Test", startTime, endTime, 100);
      proposalId = 1;
      await quadraticVoting.initializeVoterTokens(proposalId, voter1.address, 25);
    });

    it("Should calculate max affordable votes correctly", async function () {
      // With 25 tokens, max votes = 5 (5² = 25)
      const maxVotes = await quadraticVoting.getMaxAffordableVotes(proposalId, voter1.address);
      expect(maxVotes).to.equal(5);
    });

    it("Should update max affordable after voting", async function () {
      // Cast 3 votes (cost = 9), remaining = 16
      await quadraticVoting.connect(voter1).castQuadraticVote(proposalId, true, 3);
      
      // With 16 remaining and 3 current votes:
      // 4 total (1 more) costs 16-9=7, 5 total (2 more) costs 25-9=16 ✓, 6 total (3 more) costs 27 ✗
      const maxVotes = await quadraticVoting.getMaxAffordableVotes(proposalId, voter1.address);
      expect(maxVotes).to.equal(2); // Can afford 2 more votes
    });
  });

  describe("Voter Status", function () {
    let proposalId;

    beforeEach(async function () {
      const { startTime, endTime } = await getTimestamps(0);
      await quadraticVoting.createQuadraticProposal("Test", startTime, endTime, 100);
      proposalId = 1;
      await quadraticVoting.initializeVoterTokens(proposalId, voter1.address, 50);
    });

    it("Should return complete voter status", async function () {
      // Before voting
      let status = await quadraticVoting.getVoterStatus(proposalId, voter1.address);
      expect(status.hasVotedYet).to.be.false;
      expect(status.totalVotes).to.equal(0);
      expect(status.totalSpent).to.equal(0);
      expect(status.remaining).to.equal(50);

      // After voting
      await quadraticVoting.connect(voter1).castQuadraticVote(proposalId, true, 3);
      status = await quadraticVoting.getVoterStatus(proposalId, voter1.address);
      expect(status.hasVotedYet).to.be.true;
      expect(status.direction).to.be.true;
      expect(status.totalVotes).to.equal(3);
      expect(status.totalSpent).to.equal(9);
      expect(status.remaining).to.equal(41);
    });
  });

  describe("Result Retrieval", function () {
    it("Should return correct proposal result", async function () {
      const { startTime, endTime } = await getTimestamps(0);
      await quadraticVoting.createQuadraticProposal("Budget 2025", startTime, endTime, 200);
      
      await quadraticVoting.initializeVoterTokens(1, voter1.address, 100);
      await quadraticVoting.initializeVoterTokens(1, voter2.address, 100);

      await quadraticVoting.connect(voter1).castQuadraticVote(1, true, 5);  // 5 YES
      await quadraticVoting.connect(voter2).castQuadraticVote(1, false, 3); // 3 NO

      const result = await quadraticVoting.getProposalResult(1);
      expect(result.title).to.equal("Budget 2025");
      expect(result.yesVotes).to.equal(5);
      expect(result.noVotes).to.equal(3);
      expect(result.votingOpen).to.be.true;
      expect(result.baseTokens).to.equal(200);
    });

    it("Should revert for non-existent proposal", async function () {
      await expect(
        quadraticVoting.getProposalResult(999)
      ).to.be.revertedWith("Proposal does not exist");
    });
  });
});
