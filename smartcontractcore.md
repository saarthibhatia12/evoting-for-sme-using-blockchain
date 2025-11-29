# STEP 2: Smart Contract Core -- Agent Prompt {#step-2-smart-contract-core-agent-prompt}

SYSTEM CONTEXT  
  
You are building the core Solidity smart contract for a project
titled:  
  
"Blockchain-Based Secure Shareholder Voting System for SMEs"  
  
This contract runs on a local Hardhat Ethereum network and includes:  
- Shareholder registration with weighted voting  
- Proposal creation  
- Secure vote casting  
- One-vote-per-shareholder-per-proposal  
- Time-restricted voting  
- Final vote tally  
- Blockchain audit events  
  
RULES:  
- ONLY smart contract logic  
- No frontend or backend  
- No overengineering  
  
TECH STACK:  
- Solidity \^0.8.0  
- Hardhat local network  
- No ERC tokens  
- No DAO frameworks  
- No ZKP, proxy, or oracle  
  
TASK 2.1 -- Contract Skeleton & Ownership  
- Create Voting.sol  
- Set admin as contract deployer  
- Add onlyAdmin modifier  
- Add getAdmin()  
  
TASK 2.2 -- Shareholder Registration  
- mapping(address =\> uint256) public shares;  
- addShareholder(address, shares) onlyAdmin  
- shares must be \> 0  
- Emit ShareholderAdded event  
  
TASK 2.3 -- Proposal Creation  
- struct Proposal  
- mapping(uint256 =\> Proposal) proposals  
- createProposal(title, startTime, endTime) onlyAdmin  
- start \< end  
- Emit ProposalCreated event  
  
TASK 2.4 -- Vote Casting  
- mapping(uint256 =\> mapping(address =\> bool)) hasVoted  
- vote(proposalId, support)  
- prevent double vote  
- only registered shareholders  
- vote weight = shares\[msg.sender\]  
- Emit VoteCast event  
  
TASK 2.5 -- Result Retrieval  
- getProposalResult(proposalId)  
- returns title, yesVotes, noVotes, votingOpen  
  
TASK 2.6 -- Unit Testing  
- Voting.test.js  
- Test admin assignment  
- Test adding shareholders  
- Test proposal creation  
- Test valid vote  
- Test double vote  
- Test unregistered vote rejection  
  
FINAL OUTPUT:  
- Voting.sol  
- Voting.test.js  
- Test summary  
- Any assumptions  
  
COMPLETION:  
- Contract compiles  
- All tests pass  
- Weighted voting works
