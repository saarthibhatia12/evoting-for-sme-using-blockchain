const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ShareholderVoting", function () {
  let shareholderVoting;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    
    const ShareholderVoting = await ethers.getContractFactory("ShareholderVoting");
    shareholderVoting = await ShareholderVoting.deploy("SME Voting System");
  });

  describe("Deployment", function () {
    it("Should set the correct name", async function () {
      expect(await shareholderVoting.name()).to.equal("SME Voting System");
    });

    it("Should set the deployer as admin", async function () {
      expect(await shareholderVoting.admin()).to.equal(owner.address);
    });

    it("Should return a greeting", async function () {
      expect(await shareholderVoting.greet()).to.equal("Hello from SME Voting System");
    });
  });
});
