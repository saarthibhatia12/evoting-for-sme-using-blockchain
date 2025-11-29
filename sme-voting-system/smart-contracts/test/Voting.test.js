const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting", function () {
  let voting;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy();
  });

  // ============ Task 2.1: Contract Skeleton & Ownership ============
  describe("Task 2.1: Contract Skeleton & Ownership", function () {
    it("Should set the deployer as admin", async function () {
      expect(await voting.getAdmin()).to.equal(owner.address);
    });

    it("Should return the correct admin address via getAdmin()", async function () {
      const adminAddress = await voting.getAdmin();
      expect(adminAddress).to.equal(owner.address);
    });

    it("Should emit ContractDeployed event on deployment", async function () {
      const Voting = await ethers.getContractFactory("Voting");
      const newVoting = await Voting.deploy();
      
      // Check that the event was emitted by looking at deployment transaction
      const deployTx = newVoting.deploymentTransaction();
      const receipt = await deployTx.wait();
      
      // Find the ContractDeployed event in the logs
      const event = receipt.logs.find(log => {
        try {
          const parsed = newVoting.interface.parseLog(log);
          return parsed.name === "ContractDeployed";
        } catch {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
    });
  });

  // ============ Task 2.2: Shareholder Registration ============
  describe("Task 2.2: Shareholder Registration", function () {
    it("Should allow admin to add a shareholder with shares", async function () {
      await voting.addShareholder(addr1.address, 100);
      expect(await voting.shares(addr1.address)).to.equal(100);
    });

    it("Should emit ShareholderAdded event when adding shareholder", async function () {
      await expect(voting.addShareholder(addr1.address, 100))
        .to.emit(voting, "ShareholderAdded")
        .withArgs(addr1.address, 100);
    });

    it("Should reject adding shareholder with 0 shares", async function () {
      await expect(voting.addShareholder(addr1.address, 0))
        .to.be.revertedWith("Shares must be greater than 0");
    });

    it("Should reject adding shareholder with zero address", async function () {
      await expect(voting.addShareholder(ethers.ZeroAddress, 100))
        .to.be.revertedWith("Invalid shareholder address");
    });

    it("Should reject non-admin from adding shareholders", async function () {
      await expect(voting.connect(addr1).addShareholder(addr2.address, 100))
        .to.be.revertedWith("Only admin can call this function");
    });

    it("Should correctly return shares via getShares()", async function () {
      await voting.addShareholder(addr1.address, 250);
      expect(await voting.getShares(addr1.address)).to.equal(250);
    });

    it("Should correctly identify shareholders via isShareholder()", async function () {
      expect(await voting.isShareholder(addr1.address)).to.equal(false);
      await voting.addShareholder(addr1.address, 100);
      expect(await voting.isShareholder(addr1.address)).to.equal(true);
    });

    it("Should allow updating shareholder shares", async function () {
      await voting.addShareholder(addr1.address, 100);
      await voting.addShareholder(addr1.address, 200);
      expect(await voting.shares(addr1.address)).to.equal(200);
    });
  });

  // ============ Task 2.3: Proposal Creation ============
  describe("Task 2.3: Proposal Creation", function () {
    let startTime;
    let endTime;

    beforeEach(async function () {
      // Set start time to current block timestamp + 100 seconds
      const block = await ethers.provider.getBlock("latest");
      startTime = block.timestamp + 100;
      endTime = startTime + 3600; // 1 hour voting period
    });

    it("Should allow admin to create a proposal", async function () {
      await voting.createProposal("Test Proposal", startTime, endTime);
      
      const proposal = await voting.getProposal(1);
      expect(proposal.id).to.equal(1);
      expect(proposal.title).to.equal("Test Proposal");
      expect(proposal.startTime).to.equal(startTime);
      expect(proposal.endTime).to.equal(endTime);
      expect(proposal.yesVotes).to.equal(0);
      expect(proposal.noVotes).to.equal(0);
      expect(proposal.exists).to.equal(true);
    });

    it("Should emit ProposalCreated event", async function () {
      await expect(voting.createProposal("Test Proposal", startTime, endTime))
        .to.emit(voting, "ProposalCreated")
        .withArgs(1, "Test Proposal", startTime, endTime);
    });

    it("Should increment proposal count", async function () {
      expect(await voting.proposalCount()).to.equal(0);
      
      await voting.createProposal("Proposal 1", startTime, endTime);
      expect(await voting.proposalCount()).to.equal(1);
      
      await voting.createProposal("Proposal 2", startTime, endTime);
      expect(await voting.proposalCount()).to.equal(2);
    });

    it("Should reject proposal with start time >= end time", async function () {
      await expect(voting.createProposal("Bad Proposal", endTime, startTime))
        .to.be.revertedWith("Start time must be before end time");
    });

    it("Should reject proposal with same start and end time", async function () {
      await expect(voting.createProposal("Bad Proposal", startTime, startTime))
        .to.be.revertedWith("Start time must be before end time");
    });

    it("Should reject proposal with empty title", async function () {
      await expect(voting.createProposal("", startTime, endTime))
        .to.be.revertedWith("Title cannot be empty");
    });

    it("Should reject non-admin from creating proposals", async function () {
      await expect(voting.connect(addr1).createProposal("Test", startTime, endTime))
        .to.be.revertedWith("Only admin can call this function");
    });

    it("Should revert when getting non-existent proposal", async function () {
      await expect(voting.getProposal(999))
        .to.be.revertedWith("Proposal does not exist");
    });

    it("Should correctly report voting status via isVotingOpen()", async function () {
      // Create proposal that starts in the future
      await voting.createProposal("Future Proposal", startTime, endTime);
      expect(await voting.isVotingOpen(1)).to.equal(false);
      
      // Mine blocks to move time forward past start time
      await ethers.provider.send("evm_increaseTime", [150]);
      await ethers.provider.send("evm_mine");
      
      expect(await voting.isVotingOpen(1)).to.equal(true);
      
      // Move time past end time
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");
      
      expect(await voting.isVotingOpen(1)).to.equal(false);
    });
  });

  // ============ Task 2.4: Vote Casting ============
  describe("Task 2.4: Vote Casting", function () {
    let startTime;
    let endTime;

    beforeEach(async function () {
      // Add shareholders
      await voting.addShareholder(addr1.address, 100);
      await voting.addShareholder(addr2.address, 200);
      
      // Create a proposal with voting open now
      const block = await ethers.provider.getBlock("latest");
      startTime = block.timestamp + 10;
      endTime = startTime + 3600;
      
      await voting.createProposal("Test Proposal", startTime, endTime);
      
      // Move time to voting period
      await ethers.provider.send("evm_increaseTime", [50]);
      await ethers.provider.send("evm_mine");
    });

    it("Should allow shareholder to vote yes", async function () {
      await voting.connect(addr1).vote(1, true);
      
      const proposal = await voting.getProposal(1);
      expect(proposal.yesVotes).to.equal(100); // addr1 has 100 shares
      expect(proposal.noVotes).to.equal(0);
    });

    it("Should allow shareholder to vote no", async function () {
      await voting.connect(addr1).vote(1, false);
      
      const proposal = await voting.getProposal(1);
      expect(proposal.yesVotes).to.equal(0);
      expect(proposal.noVotes).to.equal(100);
    });

    it("Should weight votes by shares", async function () {
      // addr1 votes yes with 100 shares
      await voting.connect(addr1).vote(1, true);
      // addr2 votes no with 200 shares
      await voting.connect(addr2).vote(1, false);
      
      const proposal = await voting.getProposal(1);
      expect(proposal.yesVotes).to.equal(100);
      expect(proposal.noVotes).to.equal(200);
    });

    it("Should emit VoteCast event", async function () {
      await expect(voting.connect(addr1).vote(1, true))
        .to.emit(voting, "VoteCast")
        .withArgs(1, addr1.address, true, 100);
    });

    it("Should prevent double voting", async function () {
      await voting.connect(addr1).vote(1, true);
      
      await expect(voting.connect(addr1).vote(1, false))
        .to.be.revertedWith("Already voted on this proposal");
    });

    it("Should reject unregistered voter", async function () {
      const [, , , unregistered] = await ethers.getSigners();
      
      await expect(voting.connect(unregistered).vote(1, true))
        .to.be.revertedWith("Only shareholders can vote");
    });

    it("Should reject voting on non-existent proposal", async function () {
      await expect(voting.connect(addr1).vote(999, true))
        .to.be.revertedWith("Proposal does not exist");
    });

    it("Should reject voting before voting period", async function () {
      // Create a new proposal that starts in the future
      const block = await ethers.provider.getBlock("latest");
      const futureStart = block.timestamp + 1000;
      const futureEnd = futureStart + 3600;
      
      await voting.createProposal("Future Proposal", futureStart, futureEnd);
      
      await expect(voting.connect(addr1).vote(2, true))
        .to.be.revertedWith("Voting is not open");
    });

    it("Should reject voting after voting period", async function () {
      // Move time past end
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine");
      
      await expect(voting.connect(addr1).vote(1, true))
        .to.be.revertedWith("Voting is not open");
    });

    it("Should track hasVoted correctly", async function () {
      expect(await voting.hasVotedOnProposal(1, addr1.address)).to.equal(false);
      
      await voting.connect(addr1).vote(1, true);
      
      expect(await voting.hasVotedOnProposal(1, addr1.address)).to.equal(true);
      expect(await voting.hasVotedOnProposal(1, addr2.address)).to.equal(false);
    });

    it("Should allow voting on multiple proposals independently", async function () {
      // Create second proposal
      const block = await ethers.provider.getBlock("latest");
      await voting.createProposal("Second Proposal", block.timestamp, block.timestamp + 3600);
      
      // Vote on both proposals
      await voting.connect(addr1).vote(1, true);
      await voting.connect(addr1).vote(2, false);
      
      const proposal1 = await voting.getProposal(1);
      const proposal2 = await voting.getProposal(2);
      
      expect(proposal1.yesVotes).to.equal(100);
      expect(proposal2.noVotes).to.equal(100);
    });
  });

  // ============ Task 2.5: Result Retrieval ============
  describe("Task 2.5: Result Retrieval", function () {
    let startTime;
    let endTime;

    beforeEach(async function () {
      // Add shareholders
      await voting.addShareholder(addr1.address, 100);
      await voting.addShareholder(addr2.address, 200);
      
      // Create a proposal with voting open now
      const block = await ethers.provider.getBlock("latest");
      startTime = block.timestamp + 10;
      endTime = startTime + 3600;
      
      await voting.createProposal("Budget Proposal", startTime, endTime);
      
      // Move time to voting period
      await ethers.provider.send("evm_increaseTime", [50]);
      await ethers.provider.send("evm_mine");
    });

    it("Should return correct proposal result with title", async function () {
      const result = await voting.getProposalResult(1);
      
      expect(result.title).to.equal("Budget Proposal");
      expect(result.yesVotes).to.equal(0);
      expect(result.noVotes).to.equal(0);
      expect(result.votingOpen).to.equal(true);
    });

    it("Should return correct vote counts after voting", async function () {
      // addr1 votes yes (100 shares)
      await voting.connect(addr1).vote(1, true);
      // addr2 votes no (200 shares)
      await voting.connect(addr2).vote(1, false);
      
      const result = await voting.getProposalResult(1);
      
      expect(result.title).to.equal("Budget Proposal");
      expect(result.yesVotes).to.equal(100);
      expect(result.noVotes).to.equal(200);
      expect(result.votingOpen).to.equal(true);
    });

    it("Should show votingOpen as true during voting period", async function () {
      const result = await voting.getProposalResult(1);
      expect(result.votingOpen).to.equal(true);
    });

    it("Should show votingOpen as false after voting period ends", async function () {
      // Move time past end
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine");
      
      const result = await voting.getProposalResult(1);
      expect(result.votingOpen).to.equal(false);
    });

    it("Should show votingOpen as false before voting period starts", async function () {
      // Create a future proposal
      const block = await ethers.provider.getBlock("latest");
      const futureStart = block.timestamp + 1000;
      const futureEnd = futureStart + 3600;
      
      await voting.createProposal("Future Proposal", futureStart, futureEnd);
      
      const result = await voting.getProposalResult(2);
      expect(result.votingOpen).to.equal(false);
    });

    it("Should revert for non-existent proposal", async function () {
      await expect(voting.getProposalResult(999))
        .to.be.revertedWith("Proposal does not exist");
    });

    it("Should correctly tally weighted votes from multiple shareholders", async function () {
      // Add more shareholders
      const [, , , addr3, addr4] = await ethers.getSigners();
      await voting.addShareholder(addr3.address, 50);
      await voting.addShareholder(addr4.address, 150);
      
      // All vote
      await voting.connect(addr1).vote(1, true);   // 100 yes
      await voting.connect(addr2).vote(1, true);   // 200 yes
      await voting.connect(addr3).vote(1, false);  // 50 no
      await voting.connect(addr4).vote(1, false);  // 150 no
      
      const result = await voting.getProposalResult(1);
      
      expect(result.yesVotes).to.equal(300);  // 100 + 200
      expect(result.noVotes).to.equal(200);   // 50 + 150
    });

    it("Should return final results after voting closes", async function () {
      // Cast votes
      await voting.connect(addr1).vote(1, true);
      await voting.connect(addr2).vote(1, false);
      
      // Close voting
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine");
      
      const result = await voting.getProposalResult(1);
      
      expect(result.title).to.equal("Budget Proposal");
      expect(result.yesVotes).to.equal(100);
      expect(result.noVotes).to.equal(200);
      expect(result.votingOpen).to.equal(false);
    });
  });
});
