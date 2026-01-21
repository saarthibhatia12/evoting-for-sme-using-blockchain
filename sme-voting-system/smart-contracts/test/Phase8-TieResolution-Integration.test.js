/**
 * Phase 8: Tie Resolution Integration Tests
 * 
 * Tests all 9 scenarios from TIE_BREAKING_IMPLEMENTATION_PLAN.md:
 * 
 * | # | Scenario                      | Expected Result                                |
 * |---|-------------------------------|------------------------------------------------|
 * | 1 | Create tied Simple proposal   | Status = TIE_PENDING (yesVotes == noVotes)     |
 * | 2 | Admin resolves with Status Quo| Status = REJECTED, Type = STATUS_QUO_REJECT    |
 * | 3 | Admin resolves with YES vote  | Status = APPROVED, Type = CHAIRPERSON_YES      |
 * | 4 | Admin resolves with NO vote   | Status = REJECTED, Type = CHAIRPERSON_NO       |
 * | 5 | Non-admin tries to resolve    | 403 Forbidden (contract: onlyAdmin revert)     |
 * | 6 | Resolve before voting ends    | 400 Bad Request (contract: voting must close)  |
 * | 7 | Resolve non-tied proposal     | 400 Bad Request (contract: not tied)           |
 * | 8 | Resolve twice                 | 400 Bad Request (contract: already resolved)   |
 * | 9 | Tied Quadratic proposal       | Same workflow as Simple                        |
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Phase 8: Tie Resolution Integration Tests", function () {
  
  // =========================================================================
  // SECTION 8.1: Simple Voting Tie Resolution (Test Cases 1-8)
  // =========================================================================
  
  describe("8.1 - Simple Voting Tie Resolution", function () {
    let voting;
    let admin, voter1, voter2;
    
    beforeEach(async function () {
      [admin, voter1, voter2] = await ethers.getSigners();
      
      const Voting = await ethers.getContractFactory("Voting");
      voting = await Voting.deploy();
      await voting.waitForDeployment();
      
      // Add shareholders with equal shares for tie scenarios
      await voting.addShareholder(voter1.address, 50);
      await voting.addShareholder(voter2.address, 50);
    });
    
    // TEST CASE 1: Create tied Simple proposal - Status = TIE_PENDING
    it("TC1: Create tied Simple proposal - yesVotes equals noVotes", async function () {
      // Get blockchain timestamp
      const currentBlock = await ethers.provider.getBlock("latest");
      const startTime = currentBlock.timestamp;
      const endTime = startTime + 3600;
      
      await voting.createProposal("Tied Simple Proposal", startTime, endTime);
      
      // Create a tie: 50 shares YES, 50 shares NO
      await voting.connect(voter1).vote(1, true);
      await voting.connect(voter2).vote(1, false);
      
      // Close voting
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");
      
      // Verify tie exists (TIE_PENDING equivalent)
      const result = await voting.getProposalResult(1);
      expect(result.yesVotes).to.equal(50n);
      expect(result.noVotes).to.equal(50n);
      expect(result.votingOpen).to.equal(false);
      
      // No resolution yet - pending
      const resolution = await voting.getTieResolution(1);
      expect(resolution).to.equal("");
    });
    
    // TEST CASE 2: Admin resolves with Status Quo - Status = REJECTED, Type = STATUS_QUO_REJECT
    it("TC2: Admin resolves with Status Quo - STATUS_QUO_REJECT", async function () {
      const currentBlock = await ethers.provider.getBlock("latest");
      const startTime = currentBlock.timestamp;
      const endTime = startTime + 3600;
      
      await voting.createProposal("Status Quo Resolution", startTime, endTime);
      
      // Create tie
      await voting.connect(voter1).vote(1, true);
      await voting.connect(voter2).vote(1, false);
      
      // Close voting
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");
      
      // Admin resolves with STATUS_QUO_REJECT
      await expect(voting.resolveTie(1, "STATUS_QUO_REJECT"))
        .to.emit(voting, "TieResolved")
        .withArgs(1, "STATUS_QUO_REJECT");
      
      // Verify resolution recorded
      const resolution = await voting.getTieResolution(1);
      expect(resolution).to.equal("STATUS_QUO_REJECT");
    });
    
    // TEST CASE 3: Admin resolves with YES vote - Status = APPROVED, Type = CHAIRPERSON_YES
    it("TC3: Admin resolves with Chairperson YES - CHAIRPERSON_YES", async function () {
      const currentBlock = await ethers.provider.getBlock("latest");
      const startTime = currentBlock.timestamp;
      const endTime = startTime + 3600;
      
      await voting.createProposal("Chairperson YES Resolution", startTime, endTime);
      
      // Create tie
      await voting.connect(voter1).vote(1, true);
      await voting.connect(voter2).vote(1, false);
      
      // Close voting
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");
      
      // Admin resolves with CHAIRPERSON_YES
      await expect(voting.resolveTie(1, "CHAIRPERSON_YES"))
        .to.emit(voting, "TieResolved")
        .withArgs(1, "CHAIRPERSON_YES");
      
      // Verify resolution recorded
      const resolution = await voting.getTieResolution(1);
      expect(resolution).to.equal("CHAIRPERSON_YES");
    });
    
    // TEST CASE 4: Admin resolves with NO vote - Status = REJECTED, Type = CHAIRPERSON_NO
    it("TC4: Admin resolves with Chairperson NO - CHAIRPERSON_NO", async function () {
      const currentBlock = await ethers.provider.getBlock("latest");
      const startTime = currentBlock.timestamp;
      const endTime = startTime + 3600;
      
      await voting.createProposal("Chairperson NO Resolution", startTime, endTime);
      
      // Create tie
      await voting.connect(voter1).vote(1, true);
      await voting.connect(voter2).vote(1, false);
      
      // Close voting
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");
      
      // Admin resolves with CHAIRPERSON_NO
      await expect(voting.resolveTie(1, "CHAIRPERSON_NO"))
        .to.emit(voting, "TieResolved")
        .withArgs(1, "CHAIRPERSON_NO");
      
      // Verify resolution recorded
      const resolution = await voting.getTieResolution(1);
      expect(resolution).to.equal("CHAIRPERSON_NO");
    });
    
    // TEST CASE 5: Non-admin tries to resolve - 403 Forbidden
    it("TC5: Non-admin cannot resolve tie - onlyAdmin revert", async function () {
      const currentBlock = await ethers.provider.getBlock("latest");
      const startTime = currentBlock.timestamp;
      const endTime = startTime + 3600;
      
      await voting.createProposal("Non-admin Attempt", startTime, endTime);
      
      // Create tie
      await voting.connect(voter1).vote(1, true);
      await voting.connect(voter2).vote(1, false);
      
      // Close voting
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");
      
      // Non-admin (voter1) tries to resolve - should fail
      await expect(
        voting.connect(voter1).resolveTie(1, "STATUS_QUO_REJECT")
      ).to.be.revertedWith("Only admin can call this function");
      
      // Verify resolution not recorded
      expect(await voting.getTieResolution(1)).to.equal("");
    });
    
    // TEST CASE 6: Resolve before voting ends - 400 Bad Request
    it("TC6: Cannot resolve tie while voting is still open", async function () {
      const currentBlock = await ethers.provider.getBlock("latest");
      const startTime = currentBlock.timestamp;
      const endTime = startTime + 3600;
      
      await voting.createProposal("Premature Resolution", startTime, endTime);
      
      // Create tie but DON'T close voting
      await voting.connect(voter1).vote(1, true);
      await voting.connect(voter2).vote(1, false);
      
      // Try to resolve while voting still open - should fail
      await expect(
        voting.resolveTie(1, "STATUS_QUO_REJECT")
      ).to.be.revertedWith("Voting must be closed to resolve tie");
    });
    
    // TEST CASE 7: Resolve non-tied proposal - 400 Bad Request
    it("TC7: Cannot resolve non-tied proposal", async function () {
      const currentBlock = await ethers.provider.getBlock("latest");
      const startTime = currentBlock.timestamp;
      const endTime = startTime + 3600;
      
      await voting.createProposal("Non-tied Proposal", startTime, endTime);
      
      // Create NON-tie: only voter1 votes YES
      await voting.connect(voter1).vote(1, true);
      
      // Close voting
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");
      
      // Verify not tied
      const result = await voting.getProposalResult(1);
      expect(result.yesVotes).to.equal(50n);
      expect(result.noVotes).to.equal(0n);
      
      // Try to resolve non-tied proposal - should fail
      await expect(
        voting.resolveTie(1, "STATUS_QUO_REJECT")
      ).to.be.revertedWith("Proposal is not tied");
    });
    
    // TEST CASE 8: Resolve twice - 400 Bad Request
    it("TC8: Cannot resolve tie twice", async function () {
      const currentBlock = await ethers.provider.getBlock("latest");
      const startTime = currentBlock.timestamp;
      const endTime = startTime + 3600;
      
      await voting.createProposal("Double Resolution Attempt", startTime, endTime);
      
      // Create tie
      await voting.connect(voter1).vote(1, true);
      await voting.connect(voter2).vote(1, false);
      
      // Close voting
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");
      
      // First resolution - should succeed
      await voting.resolveTie(1, "STATUS_QUO_REJECT");
      expect(await voting.getTieResolution(1)).to.equal("STATUS_QUO_REJECT");
      
      // Second resolution attempt - should fail
      await expect(
        voting.resolveTie(1, "CHAIRPERSON_YES")
      ).to.be.revertedWith("Tie already resolved");
      
      // Verify first resolution unchanged
      expect(await voting.getTieResolution(1)).to.equal("STATUS_QUO_REJECT");
    });
  });
  
  // =========================================================================
  // SECTION 8.2: Quadratic Voting Tie Resolution (Test Case 9)
  // =========================================================================
  
  describe("8.2 - Quadratic Voting Tie Resolution (TC9)", function () {
    let quadraticVoting;
    let admin, voter1, voter2;
    const BASE_TOKENS = 100;
    
    beforeEach(async function () {
      [admin, voter1, voter2] = await ethers.getSigners();
      
      const QuadraticVoting = await ethers.getContractFactory("QuadraticVoting");
      quadraticVoting = await QuadraticVoting.deploy();
      await quadraticVoting.waitForDeployment();
      
      // Add shareholders
      await quadraticVoting.addShareholder(voter1.address, 50);
      await quadraticVoting.addShareholder(voter2.address, 50);
    });
    
    // TEST CASE 9a: Create tied Quadratic proposal
    it("TC9a: Create tied Quadratic proposal - votes are equal", async function () {
      const currentBlock = await ethers.provider.getBlock("latest");
      const startTime = currentBlock.timestamp;
      const endTime = startTime + 3600;
      
      await quadraticVoting.createQuadraticProposal("Tied Quadratic Proposal", startTime, endTime, BASE_TOKENS);
      
      // Initialize tokens
      await quadraticVoting.initializeVoterTokens(1, voter1.address, BASE_TOKENS);
      await quadraticVoting.initializeVoterTokens(1, voter2.address, BASE_TOKENS);
      
      // Create tie: 5 votes YES, 5 votes NO
      await quadraticVoting.connect(voter1).castQuadraticVote(1, true, 5);
      await quadraticVoting.connect(voter2).castQuadraticVote(1, false, 5);
      
      // Close voting
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");
      
      // Verify tie
      const result = await quadraticVoting.getProposalResult(1);
      expect(result.yesVotes).to.equal(5n);
      expect(result.noVotes).to.equal(5n);
      expect(result.votingOpen).to.equal(false);
      
      // No resolution yet
      expect(await quadraticVoting.getTieResolution(1)).to.equal("");
    });
    
    // TEST CASE 9b: Admin resolves Quadratic tie with STATUS_QUO_REJECT
    it("TC9b: Admin resolves Quadratic tie with STATUS_QUO_REJECT", async function () {
      const currentBlock = await ethers.provider.getBlock("latest");
      const startTime = currentBlock.timestamp;
      const endTime = startTime + 3600;
      
      await quadraticVoting.createQuadraticProposal("Quadratic Status Quo", startTime, endTime, BASE_TOKENS);
      
      await quadraticVoting.initializeVoterTokens(1, voter1.address, BASE_TOKENS);
      await quadraticVoting.initializeVoterTokens(1, voter2.address, BASE_TOKENS);
      
      // Create tie
      await quadraticVoting.connect(voter1).castQuadraticVote(1, true, 7);
      await quadraticVoting.connect(voter2).castQuadraticVote(1, false, 7);
      
      // Close voting
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");
      
      // Resolve
      await expect(quadraticVoting.resolveTie(1, "STATUS_QUO_REJECT"))
        .to.emit(quadraticVoting, "TieResolved")
        .withArgs(1, "STATUS_QUO_REJECT");
      
      expect(await quadraticVoting.getTieResolution(1)).to.equal("STATUS_QUO_REJECT");
    });
    
    // TEST CASE 9c: Admin resolves Quadratic tie with CHAIRPERSON_YES
    it("TC9c: Admin resolves Quadratic tie with CHAIRPERSON_YES", async function () {
      const currentBlock = await ethers.provider.getBlock("latest");
      const startTime = currentBlock.timestamp;
      const endTime = startTime + 3600;
      
      await quadraticVoting.createQuadraticProposal("Quadratic Chair YES", startTime, endTime, BASE_TOKENS);
      
      await quadraticVoting.initializeVoterTokens(1, voter1.address, BASE_TOKENS);
      await quadraticVoting.initializeVoterTokens(1, voter2.address, BASE_TOKENS);
      
      // Create tie
      await quadraticVoting.connect(voter1).castQuadraticVote(1, true, 3);
      await quadraticVoting.connect(voter2).castQuadraticVote(1, false, 3);
      
      // Close voting
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");
      
      // Resolve
      await expect(quadraticVoting.resolveTie(1, "CHAIRPERSON_YES"))
        .to.emit(quadraticVoting, "TieResolved")
        .withArgs(1, "CHAIRPERSON_YES");
      
      expect(await quadraticVoting.getTieResolution(1)).to.equal("CHAIRPERSON_YES");
    });
    
    // TEST CASE 9d: Admin resolves Quadratic tie with CHAIRPERSON_NO
    it("TC9d: Admin resolves Quadratic tie with CHAIRPERSON_NO", async function () {
      const currentBlock = await ethers.provider.getBlock("latest");
      const startTime = currentBlock.timestamp;
      const endTime = startTime + 3600;
      
      await quadraticVoting.createQuadraticProposal("Quadratic Chair NO", startTime, endTime, BASE_TOKENS);
      
      await quadraticVoting.initializeVoterTokens(1, voter1.address, BASE_TOKENS);
      await quadraticVoting.initializeVoterTokens(1, voter2.address, BASE_TOKENS);
      
      // Create tie
      await quadraticVoting.connect(voter1).castQuadraticVote(1, true, 10);
      await quadraticVoting.connect(voter2).castQuadraticVote(1, false, 10);
      
      // Close voting
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");
      
      // Resolve
      await expect(quadraticVoting.resolveTie(1, "CHAIRPERSON_NO"))
        .to.emit(quadraticVoting, "TieResolved")
        .withArgs(1, "CHAIRPERSON_NO");
      
      expect(await quadraticVoting.getTieResolution(1)).to.equal("CHAIRPERSON_NO");
    });
    
    // TEST CASE 9e: Non-admin cannot resolve Quadratic tie
    it("TC9e: Non-admin cannot resolve Quadratic tie", async function () {
      const currentBlock = await ethers.provider.getBlock("latest");
      const startTime = currentBlock.timestamp;
      const endTime = startTime + 3600;
      
      await quadraticVoting.createQuadraticProposal("Quadratic Non-admin", startTime, endTime, BASE_TOKENS);
      
      await quadraticVoting.initializeVoterTokens(1, voter1.address, BASE_TOKENS);
      await quadraticVoting.initializeVoterTokens(1, voter2.address, BASE_TOKENS);
      
      // Create tie
      await quadraticVoting.connect(voter1).castQuadraticVote(1, true, 4);
      await quadraticVoting.connect(voter2).castQuadraticVote(1, false, 4);
      
      // Close voting
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");
      
      // Non-admin tries to resolve
      await expect(
        quadraticVoting.connect(voter1).resolveTie(1, "STATUS_QUO_REJECT")
      ).to.be.revertedWith("Only admin can call this function");
    });
    
    // TEST CASE 9f: Cannot resolve Quadratic tie while voting open
    it("TC9f: Cannot resolve Quadratic tie while voting open", async function () {
      const currentBlock = await ethers.provider.getBlock("latest");
      const startTime = currentBlock.timestamp;
      const endTime = startTime + 3600;
      
      await quadraticVoting.createQuadraticProposal("Quadratic Premature", startTime, endTime, BASE_TOKENS);
      
      await quadraticVoting.initializeVoterTokens(1, voter1.address, BASE_TOKENS);
      await quadraticVoting.initializeVoterTokens(1, voter2.address, BASE_TOKENS);
      
      // Create tie but DON'T close voting
      await quadraticVoting.connect(voter1).castQuadraticVote(1, true, 6);
      await quadraticVoting.connect(voter2).castQuadraticVote(1, false, 6);
      
      // Try to resolve while open
      await expect(
        quadraticVoting.resolveTie(1, "STATUS_QUO_REJECT")
      ).to.be.revertedWith("Voting must be closed to resolve tie");
    });
    
    // TEST CASE 9g: Cannot resolve non-tied Quadratic proposal
    it("TC9g: Cannot resolve non-tied Quadratic proposal", async function () {
      const currentBlock = await ethers.provider.getBlock("latest");
      const startTime = currentBlock.timestamp;
      const endTime = startTime + 3600;
      
      await quadraticVoting.createQuadraticProposal("Quadratic Non-tied", startTime, endTime, BASE_TOKENS);
      
      await quadraticVoting.initializeVoterTokens(1, voter1.address, BASE_TOKENS);
      await quadraticVoting.initializeVoterTokens(1, voter2.address, BASE_TOKENS);
      
      // Create NON-tie: different vote counts
      await quadraticVoting.connect(voter1).castQuadraticVote(1, true, 8);
      await quadraticVoting.connect(voter2).castQuadraticVote(1, false, 5);
      
      // Close voting
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");
      
      // Try to resolve non-tied
      await expect(
        quadraticVoting.resolveTie(1, "STATUS_QUO_REJECT")
      ).to.be.revertedWith("Proposal is not tied");
    });
    
    // TEST CASE 9h: Cannot resolve Quadratic tie twice
    it("TC9h: Cannot resolve Quadratic tie twice", async function () {
      const currentBlock = await ethers.provider.getBlock("latest");
      const startTime = currentBlock.timestamp;
      const endTime = startTime + 3600;
      
      await quadraticVoting.createQuadraticProposal("Quadratic Double", startTime, endTime, BASE_TOKENS);
      
      await quadraticVoting.initializeVoterTokens(1, voter1.address, BASE_TOKENS);
      await quadraticVoting.initializeVoterTokens(1, voter2.address, BASE_TOKENS);
      
      // Create tie
      await quadraticVoting.connect(voter1).castQuadraticVote(1, true, 9);
      await quadraticVoting.connect(voter2).castQuadraticVote(1, false, 9);
      
      // Close voting
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");
      
      // First resolution
      await quadraticVoting.resolveTie(1, "CHAIRPERSON_YES");
      
      // Second resolution attempt
      await expect(
        quadraticVoting.resolveTie(1, "CHAIRPERSON_NO")
      ).to.be.revertedWith("Tie already resolved");
      
      // Verify first resolution unchanged
      expect(await quadraticVoting.getTieResolution(1)).to.equal("CHAIRPERSON_YES");
    });
  });
  
  // =========================================================================
  // SECTION 8.3: Additional Integration Scenarios
  // =========================================================================
  
  describe("8.3 - Additional Integration Scenarios", function () {
    let voting;
    let admin, voter1, voter2, voter3;
    
    beforeEach(async function () {
      [admin, voter1, voter2, voter3] = await ethers.getSigners();
      
      const Voting = await ethers.getContractFactory("Voting");
      voting = await Voting.deploy();
      await voting.waitForDeployment();
    });
    
    it("Should handle 0-0 tie (no votes cast)", async function () {
      await voting.addShareholder(voter1.address, 50);
      await voting.addShareholder(voter2.address, 50);
      
      const currentBlock = await ethers.provider.getBlock("latest");
      const startTime = currentBlock.timestamp;
      const endTime = startTime + 3600;
      
      await voting.createProposal("Zero Votes Tie", startTime, endTime);
      
      // NO votes cast - 0-0 tie
      
      // Close voting
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");
      
      // 0-0 is a tie
      const result = await voting.getProposalResult(1);
      expect(result.yesVotes).to.equal(0n);
      expect(result.noVotes).to.equal(0n);
      
      // Should be able to resolve
      await voting.resolveTie(1, "STATUS_QUO_REJECT");
      expect(await voting.getTieResolution(1)).to.equal("STATUS_QUO_REJECT");
    });
    
    it("Should reject invalid resolution type", async function () {
      await voting.addShareholder(voter1.address, 50);
      await voting.addShareholder(voter2.address, 50);
      
      const currentBlock = await ethers.provider.getBlock("latest");
      const startTime = currentBlock.timestamp;
      const endTime = startTime + 3600;
      
      await voting.createProposal("Invalid Type Test", startTime, endTime);
      
      // Create tie
      await voting.connect(voter1).vote(1, true);
      await voting.connect(voter2).vote(1, false);
      
      // Close voting
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");
      
      // Try invalid type
      await expect(
        voting.resolveTie(1, "INVALID_TYPE")
      ).to.be.revertedWith("Invalid resolution type");
    });
    
    it("Should handle tie with 3 voters where 2 cancel out", async function () {
      // voter1: 100 shares, voter2: 200 shares, voter3: 100 shares
      await voting.addShareholder(voter1.address, 100);
      await voting.addShareholder(voter2.address, 200);
      await voting.addShareholder(voter3.address, 100);
      
      const currentBlock = await ethers.provider.getBlock("latest");
      const startTime = currentBlock.timestamp;
      const endTime = startTime + 3600;
      
      await voting.createProposal("Three Voters Tie", startTime, endTime);
      
      // voter1(100)+voter3(100)=200 YES vs voter2(200) NO = TIE
      await voting.connect(voter1).vote(1, true);
      await voting.connect(voter2).vote(1, false);
      await voting.connect(voter3).vote(1, true);
      
      // Close voting
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");
      
      // Verify tie
      const result = await voting.getProposalResult(1);
      expect(result.yesVotes).to.equal(200n);
      expect(result.noVotes).to.equal(200n);
      
      // Resolve
      await voting.resolveTie(1, "CHAIRPERSON_YES");
      expect(await voting.getTieResolution(1)).to.equal("CHAIRPERSON_YES");
    });
  });
});
