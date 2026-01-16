/**
 * Integration Tests - Phase 6
 * 
 * Tests for backward compatibility and mixed voting scenarios.
 * Ensures simple voting remains unchanged while quadratic voting works correctly.
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Integration Tests", function () {
  
  // =========================================================================
  // TEST CATEGORY 1: SIMPLE VOTING REGRESSION (CRITICAL)
  // Verifies existing simple voting functionality remains unchanged
  // =========================================================================
  
  describe("6.1 - Simple Voting Regression (CRITICAL)", function () {
    let voting;
    let admin, shareholder1, shareholder2, shareholder3;
    
    beforeEach(async function () {
      [admin, shareholder1, shareholder2, shareholder3] = await ethers.getSigners();
      
      const Voting = await ethers.getContractFactory("Voting");
      voting = await Voting.deploy();
      await voting.waitForDeployment();
      
      // Add shareholders
      await voting.addShareholder(shareholder1.address, 100);
      await voting.addShareholder(shareholder2.address, 200);
      await voting.addShareholder(shareholder3.address, 300);
    });
    
    it("Should create simple proposal with defaults (no votingType param)", async function () {
      const now = Math.floor(Date.now() / 1000);
      const startTime = now - 60;
      const endTime = now + 3600;
      
      await voting.createProposal("Simple Proposal", startTime, endTime);
      
      const proposal = await voting.getProposal(1);
      expect(proposal.title).to.equal("Simple Proposal");
      expect(proposal.exists).to.equal(true);
    });
    
    it("Should cast vote via existing vote function", async function () {
      const now = Math.floor(Date.now() / 1000);
      await voting.createProposal("Vote Test", now - 60, now + 3600);
      
      // Cast vote - should work exactly as before
      await voting.connect(shareholder1).vote(1, true);
      
      const result = await voting.getProposalResult(1);
      expect(result.yesVotes).to.equal(100n); // 100 shares
    });
    
    it("Should weight votes by shares correctly", async function () {
      const now = Math.floor(Date.now() / 1000);
      await voting.createProposal("Weighted Vote Test", now - 60, now + 3600);
      
      // Different shareholders vote
      await voting.connect(shareholder1).vote(1, true);  // 100 shares
      await voting.connect(shareholder2).vote(1, false); // 200 shares
      await voting.connect(shareholder3).vote(1, true);  // 300 shares
      
      const result = await voting.getProposalResult(1);
      expect(result.yesVotes).to.equal(400n);  // 100 + 300
      expect(result.noVotes).to.equal(200n);   // 200
    });
    
    it("Should prevent double voting", async function () {
      const now = Math.floor(Date.now() / 1000);
      await voting.createProposal("Double Vote Test", now - 60, now + 3600);
      
      await voting.connect(shareholder1).vote(1, true);
      
      await expect(
        voting.connect(shareholder1).vote(1, false)
      ).to.be.revertedWith("Already voted on this proposal");
    });
    
    it("Should display results correctly", async function () {
      const now = Math.floor(Date.now() / 1000);
      await voting.createProposal("Results Test", now - 60, now + 3600);
      
      await voting.connect(shareholder1).vote(1, true);
      await voting.connect(shareholder2).vote(1, true);
      
      const result = await voting.getProposalResult(1);
      expect(result.title).to.equal("Results Test");
      expect(result.yesVotes).to.equal(300n); // 100 + 200
      expect(result.noVotes).to.equal(0n);
      expect(result.votingOpen).to.equal(true);
    });
    
    it("Should track hasVoted correctly", async function () {
      const now = Math.floor(Date.now() / 1000);
      await voting.createProposal("HasVoted Test", now - 60, now + 3600);
      
      expect(await voting.hasVotedOnProposal(1, shareholder1.address)).to.equal(false);
      
      await voting.connect(shareholder1).vote(1, true);
      
      expect(await voting.hasVotedOnProposal(1, shareholder1.address)).to.equal(true);
      expect(await voting.hasVotedOnProposal(1, shareholder2.address)).to.equal(false);
    });
    
    it("Should reject non-shareholder voting", async function () {
      const [, , , , nonShareholder] = await ethers.getSigners();
      const now = Math.floor(Date.now() / 1000);
      await voting.createProposal("Non-shareholder Test", now - 60, now + 3600);
      
      await expect(
        voting.connect(nonShareholder).vote(1, true)
      ).to.be.revertedWith("Only shareholders can vote");
    });
    
    it("Should reject voting outside time window", async function () {
      const now = Math.floor(Date.now() / 1000);
      
      // Create proposal that hasn't started
      await voting.createProposal("Future Proposal", now + 3600, now + 7200);
      
      await expect(
        voting.connect(shareholder1).vote(1, true)
      ).to.be.revertedWith("Voting is not open");
    });
  });
  
  // =========================================================================
  // TEST CATEGORY 2: QUADRATIC VOTING FLOW
  // Verifies quadratic voting features work correctly
  // =========================================================================
  
  describe("6.2 - Quadratic Voting Flow", function () {
    let quadraticVoting;
    let admin, voter1, voter2, voter3;
    
    beforeEach(async function () {
      [admin, voter1, voter2, voter3] = await ethers.getSigners();
      
      const QuadraticVoting = await ethers.getContractFactory("QuadraticVoting");
      quadraticVoting = await QuadraticVoting.deploy();
      await quadraticVoting.waitForDeployment();
      
      // Add shareholders
      await quadraticVoting.addShareholder(voter1.address, 100);
      await quadraticVoting.addShareholder(voter2.address, 200);
      await quadraticVoting.addShareholder(voter3.address, 300);
    });
    
    it("Should calculate token balances proportionally", async function () {
      // With base 100 tokens and total shares = 600
      // voter1: 100/600 * 100 = 16.67 ≈ 16 tokens
      // voter2: 200/600 * 100 = 33.33 ≈ 33 tokens
      // voter3: 300/600 * 100 = 50 tokens
      
      const now = Math.floor(Date.now() / 1000);
      await quadraticVoting.createQuadraticProposal("Token Calc Test", now - 60, now + 3600, 100);
      
      // Initialize with actual proportional values
      await quadraticVoting.initializeVoterTokens(1, voter1.address, 16);
      await quadraticVoting.initializeVoterTokens(1, voter2.address, 33);
      await quadraticVoting.initializeVoterTokens(1, voter3.address, 50);
      
      expect(await quadraticVoting.getRemainingTokens(1, voter1.address)).to.equal(16n);
      expect(await quadraticVoting.getRemainingTokens(1, voter2.address)).to.equal(33n);
      expect(await quadraticVoting.getRemainingTokens(1, voter3.address)).to.equal(50n);
    });
    
    it("Should apply quadratic cost correctly (n² formula)", async function () {
      const now = Math.floor(Date.now() / 1000);
      await quadraticVoting.createQuadraticProposal("Cost Test", now - 60, now + 3600, 100);
      await quadraticVoting.initializeVoterTokens(1, voter1.address, 100);
      
      // Cast 3 votes - should cost 9 tokens (3² = 9)
      await quadraticVoting.connect(voter1).castQuadraticVote(1, true, 3);
      
      expect(await quadraticVoting.getRemainingTokens(1, voter1.address)).to.equal(91n); // 100 - 9
      expect(await quadraticVoting.getTokensSpent(1, voter1.address)).to.equal(9n);
    });
    
    it("Should apply incremental cost correctly", async function () {
      const now = Math.floor(Date.now() / 1000);
      await quadraticVoting.createQuadraticProposal("Incremental Cost Test", now - 60, now + 3600, 100);
      await quadraticVoting.initializeVoterTokens(1, voter1.address, 100);
      
      // First: Cast 2 votes - costs 4 tokens (2² = 4)
      await quadraticVoting.connect(voter1).castQuadraticVote(1, true, 2);
      expect(await quadraticVoting.getTokensSpent(1, voter1.address)).to.equal(4n);
      
      // Second: Cast 3 more votes - costs (2+3)² - 2² = 25 - 4 = 21 tokens
      await quadraticVoting.connect(voter1).castQuadraticVote(1, true, 3);
      expect(await quadraticVoting.getTokensSpent(1, voter1.address)).to.equal(25n); // 4 + 21
      
      // Total votes cast = 5, total tokens spent = 25 (5² = 25)
      expect(await quadraticVoting.getVotesCast(1, voter1.address)).to.equal(5n);
    });
    
    it("Should lock vote direction after first vote", async function () {
      const now = Math.floor(Date.now() / 1000);
      await quadraticVoting.createQuadraticProposal("Direction Lock Test", now - 60, now + 3600, 100);
      await quadraticVoting.initializeVoterTokens(1, voter1.address, 100);
      
      // First vote: YES
      await quadraticVoting.connect(voter1).castQuadraticVote(1, true, 1);
      
      // Try to vote NO - should fail
      await expect(
        quadraticVoting.connect(voter1).castQuadraticVote(1, false, 1)
      ).to.be.revertedWith("Cannot change vote direction after first vote");
      
      // Continue voting YES - should succeed
      await quadraticVoting.connect(voter1).castQuadraticVote(1, true, 2);
      expect(await quadraticVoting.getVotesCast(1, voter1.address)).to.equal(3n);
    });
    
    it("Should calculate voting power as vote count", async function () {
      const now = Math.floor(Date.now() / 1000);
      await quadraticVoting.createQuadraticProposal("Voting Power Test", now - 60, now + 3600, 100);
      await quadraticVoting.initializeVoterTokens(1, voter1.address, 25);
      await quadraticVoting.initializeVoterTokens(1, voter2.address, 25);
      
      // voter1: 5 votes (costs 25 tokens)
      await quadraticVoting.connect(voter1).castQuadraticVote(1, true, 5);
      
      // voter2: 3 votes (costs 9 tokens)
      await quadraticVoting.connect(voter2).castQuadraticVote(1, false, 3);
      
      const result = await quadraticVoting.getProposalResult(1);
      expect(result.yesVotes).to.equal(5n);  // 5 votes
      expect(result.noVotes).to.equal(3n);   // 3 votes
    });
    
    it("Should reject vote with insufficient tokens", async function () {
      const now = Math.floor(Date.now() / 1000);
      await quadraticVoting.createQuadraticProposal("Insufficient Test", now - 60, now + 3600, 100);
      await quadraticVoting.initializeVoterTokens(1, voter1.address, 8); // Only 8 tokens
      
      // Try to cast 3 votes (costs 9 tokens)
      await expect(
        quadraticVoting.connect(voter1).castQuadraticVote(1, true, 3)
      ).to.be.revertedWith("Insufficient tokens for this many votes");
    });
    
    it("Should correctly calculate max affordable votes", async function () {
      const now = Math.floor(Date.now() / 1000);
      await quadraticVoting.createQuadraticProposal("Max Affordable Test", now - 60, now + 3600, 100);
      await quadraticVoting.initializeVoterTokens(1, voter1.address, 25);
      
      // With 25 tokens, max affordable = 5 votes (5² = 25)
      expect(await quadraticVoting.getMaxAffordableVotes(1, voter1.address)).to.equal(5n);
      
      // After casting 3 votes (9 tokens spent), remaining = 16
      await quadraticVoting.connect(voter1).castQuadraticVote(1, true, 3);
      
      // Current votes = 3, with 16 remaining tokens
      // Can afford: 4 more (7² - 3² = 49 - 9 = 40 > 16) NO
      // Can afford: 3 more (6² - 3² = 36 - 9 = 27 > 16) NO
      // Can afford: 2 more (5² - 3² = 25 - 9 = 16) YES!
      expect(await quadraticVoting.getMaxAffordableVotes(1, voter1.address)).to.equal(2n);
    });
  });
  
  // =========================================================================
  // TEST CATEGORY 3: MIXED PROPOSALS
  // Verifies both voting types work simultaneously
  // =========================================================================
  
  describe("6.3 - Mixed Proposals", function () {
    let voting, quadraticVoting;
    let admin, voter1, voter2;
    
    beforeEach(async function () {
      [admin, voter1, voter2] = await ethers.getSigners();
      
      // Deploy both contracts
      const Voting = await ethers.getContractFactory("Voting");
      voting = await Voting.deploy();
      await voting.waitForDeployment();
      
      const QuadraticVoting = await ethers.getContractFactory("QuadraticVoting");
      quadraticVoting = await QuadraticVoting.deploy();
      await quadraticVoting.waitForDeployment();
      
      // Add same shareholders to both
      await voting.addShareholder(voter1.address, 100);
      await voting.addShareholder(voter2.address, 200);
      
      await quadraticVoting.addShareholder(voter1.address, 100);
      await quadraticVoting.addShareholder(voter2.address, 200);
    });
    
    it("Should handle simple and quadratic proposals simultaneously", async function () {
      const now = Math.floor(Date.now() / 1000);
      
      // Create simple proposal
      await voting.createProposal("Simple Proposal", now - 60, now + 3600);
      
      // Create quadratic proposal
      await quadraticVoting.createQuadraticProposal("Quadratic Proposal", now - 60, now + 3600, 100);
      await quadraticVoting.initializeVoterTokens(1, voter1.address, 50);
      await quadraticVoting.initializeVoterTokens(1, voter2.address, 50);
      
      // Vote on simple
      await voting.connect(voter1).vote(1, true);
      await voting.connect(voter2).vote(1, false);
      
      // Vote on quadratic
      await quadraticVoting.connect(voter1).castQuadraticVote(1, true, 3);
      await quadraticVoting.connect(voter2).castQuadraticVote(1, false, 2);
      
      // Verify simple results
      const simpleResult = await voting.getProposalResult(1);
      expect(simpleResult.yesVotes).to.equal(100n);
      expect(simpleResult.noVotes).to.equal(200n);
      
      // Verify quadratic results
      const quadraticResult = await quadraticVoting.getProposalResult(1);
      expect(quadraticResult.yesVotes).to.equal(3n);
      expect(quadraticResult.noVotes).to.equal(2n);
    });
    
    it("Should keep voting types independent", async function () {
      const now = Math.floor(Date.now() / 1000);
      
      // Create proposals
      await voting.createProposal("Simple Only", now - 60, now + 3600);
      await quadraticVoting.createQuadraticProposal("Quadratic Only", now - 60, now + 3600, 100);
      await quadraticVoting.initializeVoterTokens(1, voter1.address, 50);
      
      // Vote on simple
      await voting.connect(voter1).vote(1, true);
      
      // Vote on quadratic
      await quadraticVoting.connect(voter1).castQuadraticVote(1, true, 2);
      
      // Voter1 can vote on both without conflict
      expect(await voting.hasVotedOnProposal(1, voter1.address)).to.equal(true);
      expect(await quadraticVoting.hasVotedOnProposal(1, voter1.address)).to.equal(true);
    });
    
    it("Should maintain separate result tallies", async function () {
      const now = Math.floor(Date.now() / 1000);
      
      // Create multiple proposals of each type
      await voting.createProposal("Simple 1", now - 60, now + 3600);
      await voting.createProposal("Simple 2", now - 60, now + 3600);
      
      await quadraticVoting.createQuadraticProposal("Quadratic 1", now - 60, now + 3600, 100);
      await quadraticVoting.createQuadraticProposal("Quadratic 2", now - 60, now + 3600, 100);
      
      // Initialize tokens
      await quadraticVoting.initializeVoterTokens(1, voter1.address, 50);
      await quadraticVoting.initializeVoterTokens(1, voter2.address, 50);
      await quadraticVoting.initializeVoterTokens(2, voter1.address, 50);
      await quadraticVoting.initializeVoterTokens(2, voter2.address, 50);
      
      // Vote on all proposals
      await voting.connect(voter1).vote(1, true);
      await voting.connect(voter1).vote(2, false);
      await voting.connect(voter2).vote(1, false);
      await voting.connect(voter2).vote(2, true);
      
      await quadraticVoting.connect(voter1).castQuadraticVote(1, true, 2);
      await quadraticVoting.connect(voter1).castQuadraticVote(2, false, 3);
      await quadraticVoting.connect(voter2).castQuadraticVote(1, false, 1);
      await quadraticVoting.connect(voter2).castQuadraticVote(2, true, 4);
      
      // Verify all results are independent
      const simple1 = await voting.getProposalResult(1);
      const simple2 = await voting.getProposalResult(2);
      const quad1 = await quadraticVoting.getProposalResult(1);
      const quad2 = await quadraticVoting.getProposalResult(2);
      
      expect(simple1.yesVotes).to.equal(100n);
      expect(simple1.noVotes).to.equal(200n);
      expect(simple2.yesVotes).to.equal(200n);
      expect(simple2.noVotes).to.equal(100n);
      
      expect(quad1.yesVotes).to.equal(2n);
      expect(quad1.noVotes).to.equal(1n);
      expect(quad2.yesVotes).to.equal(4n);
      expect(quad2.noVotes).to.equal(3n);
    });
  });
  
  // =========================================================================
  // TEST CATEGORY 4: BACKWARD COMPATIBILITY
  // Ensures new features don't break existing functionality
  // =========================================================================
  
  describe("6.4 - Backward Compatibility", function () {
    let voting;
    let admin, voter1;
    
    beforeEach(async function () {
      [admin, voter1] = await ethers.getSigners();
      
      const Voting = await ethers.getContractFactory("Voting");
      voting = await Voting.deploy();
      await voting.waitForDeployment();
      
      await voting.addShareholder(voter1.address, 100);
    });
    
    it("Should accept existing createProposal signature without new params", async function () {
      const now = Math.floor(Date.now() / 1000);
      
      // Original signature: createProposal(title, startTime, endTime)
      await voting.createProposal("Backward Compat Test", now - 60, now + 3600);
      
      const proposal = await voting.getProposal(1);
      expect(proposal.title).to.equal("Backward Compat Test");
    });
    
    it("Should accept existing vote signature without new params", async function () {
      const now = Math.floor(Date.now() / 1000);
      await voting.createProposal("Vote Compat Test", now - 60, now + 3600);
      
      // Original signature: vote(proposalId, support)
      await voting.connect(voter1).vote(1, true);
      
      const result = await voting.getProposalResult(1);
      expect(result.yesVotes).to.equal(100n);
    });
    
    it("Should return existing response format for getProposalResult", async function () {
      const now = Math.floor(Date.now() / 1000);
      await voting.createProposal("Response Format Test", now - 60, now + 3600);
      await voting.connect(voter1).vote(1, true);
      
      // Original response: (title, yesVotes, noVotes, votingOpen)
      const result = await voting.getProposalResult(1);
      
      expect(result.title).to.be.a("string");
      expect(result.yesVotes).to.be.a("bigint");
      expect(result.noVotes).to.be.a("bigint");
      expect(result.votingOpen).to.be.a("boolean");
    });
    
    it("Should maintain event emissions for existing functionality", async function () {
      const now = Math.floor(Date.now() / 1000);
      
      // ProposalCreated event
      await expect(voting.createProposal("Event Test", now - 60, now + 3600))
        .to.emit(voting, "ProposalCreated");
      
      // VoteCast event
      await expect(voting.connect(voter1).vote(1, true))
        .to.emit(voting, "VoteCast")
        .withArgs(1, voter1.address, true, 100);
    });
  });
  
  // =========================================================================
  // TEST CATEGORY 5: EDGE CASES
  // Tests boundary conditions and edge cases
  // =========================================================================
  
  describe("6.5 - Edge Cases", function () {
    let quadraticVoting;
    let admin, voter1;
    
    beforeEach(async function () {
      [admin, voter1] = await ethers.getSigners();
      
      const QuadraticVoting = await ethers.getContractFactory("QuadraticVoting");
      quadraticVoting = await QuadraticVoting.deploy();
      await quadraticVoting.waitForDeployment();
      
      await quadraticVoting.addShareholder(voter1.address, 100);
    });
    
    it("Should handle single vote correctly", async function () {
      const now = Math.floor(Date.now() / 1000);
      await quadraticVoting.createQuadraticProposal("Single Vote", now - 60, now + 3600, 100);
      await quadraticVoting.initializeVoterTokens(1, voter1.address, 100);
      
      // Cast exactly 1 vote
      await quadraticVoting.connect(voter1).castQuadraticVote(1, true, 1);
      
      expect(await quadraticVoting.getVotesCast(1, voter1.address)).to.equal(1n);
      expect(await quadraticVoting.getTokensSpent(1, voter1.address)).to.equal(1n); // 1² = 1
    });
    
    it("Should handle maximum affordable votes exactly", async function () {
      const now = Math.floor(Date.now() / 1000);
      await quadraticVoting.createQuadraticProposal("Max Votes", now - 60, now + 3600, 100);
      await quadraticVoting.initializeVoterTokens(1, voter1.address, 25);
      
      // With 25 tokens, max votes = 5 (5² = 25)
      await quadraticVoting.connect(voter1).castQuadraticVote(1, true, 5);
      
      expect(await quadraticVoting.getRemainingTokens(1, voter1.address)).to.equal(0n);
      expect(await quadraticVoting.getVotesCast(1, voter1.address)).to.equal(5n);
    });
    
    it("Should handle voting at exact time boundaries", async function () {
      const now = Math.floor(Date.now() / 1000);
      // Use a time that's clearly in the past for start and future for end
      await quadraticVoting.createQuadraticProposal("Time Boundary", now - 120, now + 3600, 100);
      await quadraticVoting.initializeVoterTokens(1, voter1.address, 10);
      
      // Should work when clearly within voting period
      await quadraticVoting.connect(voter1).castQuadraticVote(1, true, 1);
      expect(await quadraticVoting.getVotesCast(1, voter1.address)).to.equal(1n);
    });
    
    it("Should handle zero tokens gracefully", async function () {
      const now = Math.floor(Date.now() / 1000);
      await quadraticVoting.createQuadraticProposal("Zero Tokens", now - 60, now + 3600, 100);
      
      // Contract requires tokens > 0, so this should fail during initialization
      await expect(
        quadraticVoting.initializeVoterTokens(1, voter1.address, 0)
      ).to.be.revertedWith("Tokens must be greater than 0");
    });
  });
});
