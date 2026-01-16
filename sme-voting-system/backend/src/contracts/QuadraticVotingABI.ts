// QuadraticVoting Contract ABI for Backend
// Includes admin functions for creating proposals and initializing voter tokens

export const QuadraticVotingABI = [
  // Constructor
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "admin", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "ContractDeployed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "shareholder", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "shares", "type": "uint256" }
    ],
    "name": "ShareholderAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "proposalId", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "title", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "startTime", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "endTime", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "baseTokens", "type": "uint256" }
    ],
    "name": "QuadraticProposalCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "proposalId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "voter", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "tokens", "type": "uint256" }
    ],
    "name": "VoterTokensInitialized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "proposalId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "voter", "type": "address" },
      { "indexed": false, "internalType": "bool", "name": "support", "type": "bool" },
      { "indexed": false, "internalType": "uint256", "name": "voteCount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "tokensCost", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "remainingTokens", "type": "uint256" }
    ],
    "name": "QuadraticVoteCast",
    "type": "event"
  },
  // Admin functions
  {
    "inputs": [],
    "name": "admin",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAdmin",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  // Shareholder management
  {
    "inputs": [
      { "internalType": "address", "name": "_shareholder", "type": "address" },
      { "internalType": "uint256", "name": "_shares", "type": "uint256" }
    ],
    "name": "addShareholder",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "_shareholder", "type": "address" }],
    "name": "getShares",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "_shareholder", "type": "address" }],
    "name": "isShareholder",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  // Proposal management
  {
    "inputs": [
      { "internalType": "string", "name": "_title", "type": "string" },
      { "internalType": "uint256", "name": "_startTime", "type": "uint256" },
      { "internalType": "uint256", "name": "_endTime", "type": "uint256" },
      { "internalType": "uint256", "name": "_baseTokens", "type": "uint256" }
    ],
    "name": "createQuadraticProposal",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_proposalId", "type": "uint256" }],
    "name": "getProposal",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "id", "type": "uint256" },
          { "internalType": "string", "name": "title", "type": "string" },
          { "internalType": "uint256", "name": "startTime", "type": "uint256" },
          { "internalType": "uint256", "name": "endTime", "type": "uint256" },
          { "internalType": "uint256", "name": "yesVotes", "type": "uint256" },
          { "internalType": "uint256", "name": "noVotes", "type": "uint256" },
          { "internalType": "uint256", "name": "baseTokens", "type": "uint256" },
          { "internalType": "bool", "name": "exists", "type": "bool" }
        ],
        "internalType": "struct QuadraticVoting.QuadraticProposal",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_proposalId", "type": "uint256" }],
    "name": "isVotingOpen",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  // Token initialization
  {
    "inputs": [
      { "internalType": "uint256", "name": "_proposalId", "type": "uint256" },
      { "internalType": "address", "name": "_voter", "type": "address" },
      { "internalType": "uint256", "name": "_tokens", "type": "uint256" }
    ],
    "name": "initializeVoterTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_proposalId", "type": "uint256" },
      { "internalType": "address[]", "name": "_voters", "type": "address[]" },
      { "internalType": "uint256[]", "name": "_tokens", "type": "uint256[]" }
    ],
    "name": "batchInitializeVoterTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Voting functions
  {
    "inputs": [
      { "internalType": "uint256", "name": "_proposalId", "type": "uint256" },
      { "internalType": "bool", "name": "_support", "type": "bool" },
      { "internalType": "uint256", "name": "_voteCount", "type": "uint256" }
    ],
    "name": "castQuadraticVote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Cost calculation
  {
    "inputs": [
      { "internalType": "uint256", "name": "_currentVotes", "type": "uint256" },
      { "internalType": "uint256", "name": "_additionalVotes", "type": "uint256" }
    ],
    "name": "calculateVoteCost",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "pure",
    "type": "function"
  },
  // Voter info
  {
    "inputs": [
      { "internalType": "uint256", "name": "_proposalId", "type": "uint256" },
      { "internalType": "address", "name": "_voter", "type": "address" }
    ],
    "name": "getRemainingTokens",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_proposalId", "type": "uint256" },
      { "internalType": "address", "name": "_voter", "type": "address" }
    ],
    "name": "getTokensSpent",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_proposalId", "type": "uint256" },
      { "internalType": "address", "name": "_voter", "type": "address" }
    ],
    "name": "getVoterStatus",
    "outputs": [
      { "internalType": "uint256", "name": "totalTokens", "type": "uint256" },
      { "internalType": "uint256", "name": "tokensRemaining", "type": "uint256" },
      { "internalType": "uint256", "name": "tokensCost", "type": "uint256" },
      { "internalType": "uint256", "name": "votesCount", "type": "uint256" },
      { "internalType": "bool", "name": "hasVotedFlag", "type": "bool" },
      { "internalType": "bool", "name": "voteDir", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_proposalId", "type": "uint256" },
      { "internalType": "address", "name": "_voter", "type": "address" }
    ],
    "name": "hasVotedOnProposal",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  // Results
  {
    "inputs": [{ "internalType": "uint256", "name": "_proposalId", "type": "uint256" }],
    "name": "getProposalResult",
    "outputs": [
      { "internalType": "string", "name": "title", "type": "string" },
      { "internalType": "uint256", "name": "yesVotes", "type": "uint256" },
      { "internalType": "uint256", "name": "noVotes", "type": "uint256" },
      { "internalType": "bool", "name": "votingOpen", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "proposalCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export default QuadraticVotingABI;
