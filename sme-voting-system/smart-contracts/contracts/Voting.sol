// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Voting
 * @dev Blockchain-Based Secure Shareholder Voting System for SMEs
 * @notice This contract manages shareholder voting with weighted votes based on shares
 */
contract Voting {
    // ============ State Variables ============
    
    /// @notice The admin address (contract deployer)
    address private admin;

    /// @notice Mapping of shareholder addresses to their share count
    mapping(address => uint256) public shares;

    /// @notice Counter for proposal IDs
    uint256 public proposalCount;

    /// @notice Struct to represent a proposal
    struct Proposal {
        uint256 id;
        string title;
        uint256 startTime;
        uint256 endTime;
        uint256 yesVotes;
        uint256 noVotes;
        bool exists;
    }

    /// @notice Mapping of proposal ID to Proposal
    mapping(uint256 => Proposal) public proposals;

    /// @notice Mapping to track if a shareholder has voted on a proposal
    /// @dev proposalId => voterAddress => hasVoted
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    /// @notice Mapping to store tie resolution type for proposals
    /// @dev proposalId => resolutionType (e.g., "STATUS_QUO_REJECT", "CHAIRPERSON_YES", "CHAIRPERSON_NO")
    mapping(uint256 => string) public tieResolution;

    // ============ Events ============
    
    /// @notice Emitted when the contract is deployed
    event ContractDeployed(address indexed admin, uint256 timestamp);

    /// @notice Emitted when a shareholder is added
    event ShareholderAdded(address indexed shareholder, uint256 shares);

    /// @notice Emitted when a proposal is created
    event ProposalCreated(uint256 indexed proposalId, string title, uint256 startTime, uint256 endTime);

    /// @notice Emitted when a vote is cast
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);

    /// @notice Emitted when a tie is resolved by admin
    event TieResolved(uint256 indexed proposalId, string resolutionType);

    // ============ Modifiers ============
    
    /// @notice Restricts function access to admin only
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    // ============ Constructor ============
    
    /// @notice Sets the deployer as the admin
    constructor() {
        admin = msg.sender;
        emit ContractDeployed(admin, block.timestamp);
    }

    // ============ Admin Functions ============
    
    /// @notice Returns the admin address
    /// @return The address of the contract admin
    function getAdmin() public view returns (address) {
        return admin;
    }

    // ============ Shareholder Management ============

    /// @notice Adds a shareholder with a specified number of shares
    /// @param _shareholder The address of the shareholder
    /// @param _shares The number of shares (must be > 0)
    function addShareholder(address _shareholder, uint256 _shares) public onlyAdmin {
        require(_shareholder != address(0), "Invalid shareholder address");
        require(_shares > 0, "Shares must be greater than 0");
        
        shares[_shareholder] = _shares;
        emit ShareholderAdded(_shareholder, _shares);
    }

    /// @notice Gets the number of shares for a shareholder
    /// @param _shareholder The address of the shareholder
    /// @return The number of shares
    function getShares(address _shareholder) public view returns (uint256) {
        return shares[_shareholder];
    }

    /// @notice Checks if an address is a registered shareholder
    /// @param _shareholder The address to check
    /// @return True if the address has shares > 0
    function isShareholder(address _shareholder) public view returns (bool) {
        return shares[_shareholder] > 0;
    }

    // ============ Proposal Management ============

    /// @notice Creates a new proposal
    /// @param _title The title of the proposal
    /// @param _startTime The start time of voting (unix timestamp)
    /// @param _endTime The end time of voting (unix timestamp)
    function createProposal(
        string memory _title,
        uint256 _startTime,
        uint256 _endTime
    ) public onlyAdmin {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_startTime < _endTime, "Start time must be before end time");
        
        proposalCount++;
        uint256 proposalId = proposalCount;
        
        proposals[proposalId] = Proposal({
            id: proposalId,
            title: _title,
            startTime: _startTime,
            endTime: _endTime,
            yesVotes: 0,
            noVotes: 0,
            exists: true
        });
        
        emit ProposalCreated(proposalId, _title, _startTime, _endTime);
    }

    /// @notice Gets a proposal by ID
    /// @param _proposalId The ID of the proposal
    /// @return The proposal struct
    function getProposal(uint256 _proposalId) public view returns (Proposal memory) {
        require(proposals[_proposalId].exists, "Proposal does not exist");
        return proposals[_proposalId];
    }

    /// @notice Checks if voting is currently open for a proposal
    /// @param _proposalId The ID of the proposal
    /// @return True if voting is open
    function isVotingOpen(uint256 _proposalId) public view returns (bool) {
        Proposal memory proposal = proposals[_proposalId];
        if (!proposal.exists) return false;
        return block.timestamp >= proposal.startTime && block.timestamp <= proposal.endTime;
    }

    // ============ Voting ============

    /// @notice Cast a vote on a proposal
    /// @param _proposalId The ID of the proposal to vote on
    /// @param _support True for yes, false for no
    function vote(uint256 _proposalId, bool _support) public {
        // Check proposal exists
        require(proposals[_proposalId].exists, "Proposal does not exist");
        
        // Check voter is a registered shareholder
        require(shares[msg.sender] > 0, "Only shareholders can vote");
        
        // Check voting is open
        require(isVotingOpen(_proposalId), "Voting is not open");
        
        // Check voter hasn't already voted
        require(!hasVoted[_proposalId][msg.sender], "Already voted on this proposal");
        
        // Get vote weight (number of shares)
        uint256 weight = shares[msg.sender];
        
        // Record the vote
        hasVoted[_proposalId][msg.sender] = true;
        
        // Add weighted vote
        if (_support) {
            proposals[_proposalId].yesVotes += weight;
        } else {
            proposals[_proposalId].noVotes += weight;
        }
        
        emit VoteCast(_proposalId, msg.sender, _support, weight);
    }

    /// @notice Check if an address has voted on a proposal
    /// @param _proposalId The ID of the proposal
    /// @param _voter The address to check
    /// @return True if the address has voted
    function hasVotedOnProposal(uint256 _proposalId, address _voter) public view returns (bool) {
        return hasVoted[_proposalId][_voter];
    }

    // ============ Result Retrieval ============

    /// @notice Gets the result of a proposal
    /// @param _proposalId The ID of the proposal
    /// @return title The title of the proposal
    /// @return yesVotes The total weighted yes votes
    /// @return noVotes The total weighted no votes
    /// @return votingOpen Whether voting is currently open
    function getProposalResult(uint256 _proposalId) public view returns (
        string memory title,
        uint256 yesVotes,
        uint256 noVotes,
        bool votingOpen
    ) {
        require(proposals[_proposalId].exists, "Proposal does not exist");
        
        Proposal memory proposal = proposals[_proposalId];
        
        return (
            proposal.title,
            proposal.yesVotes,
            proposal.noVotes,
            isVotingOpen(_proposalId)
        );
    }

    // ============ Tie Resolution ============

    /// @notice Resolves a tied proposal by recording the resolution type on-chain
    /// @dev Can only be called by admin after voting has ended
    /// @param _proposalId The ID of the proposal to resolve
    /// @param _type The resolution type ("STATUS_QUO_REJECT", "CHAIRPERSON_YES", or "CHAIRPERSON_NO")
    function resolveTie(uint256 _proposalId, string memory _type) public onlyAdmin {
        require(proposals[_proposalId].exists, "Proposal does not exist");
        require(!isVotingOpen(_proposalId), "Voting must be closed to resolve tie");
        require(proposals[_proposalId].yesVotes == proposals[_proposalId].noVotes, "Proposal is not tied");
        require(bytes(tieResolution[_proposalId]).length == 0, "Tie already resolved");
        
        // Validate resolution type
        require(
            keccak256(bytes(_type)) == keccak256(bytes("STATUS_QUO_REJECT")) ||
            keccak256(bytes(_type)) == keccak256(bytes("CHAIRPERSON_YES")) ||
            keccak256(bytes(_type)) == keccak256(bytes("CHAIRPERSON_NO")),
            "Invalid resolution type"
        );
        
        tieResolution[_proposalId] = _type;
        emit TieResolved(_proposalId, _type);
    }

    /// @notice Gets the tie resolution type for a proposal
    /// @param _proposalId The ID of the proposal
    /// @return The resolution type, or empty string if not resolved
    function getTieResolution(uint256 _proposalId) public view returns (string memory) {
        require(proposals[_proposalId].exists, "Proposal does not exist");
        return tieResolution[_proposalId];
    }
}
