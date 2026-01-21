// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title QuadraticVoting
 * @dev Quadratic Voting Contract for SME Voting System
 * @notice This is a SEPARATE contract from Voting.sol - does NOT modify existing voting
 * 
 * Key Features:
 * - Cost model: n² total tokens for n votes (3 votes = 9 tokens)
 * - Vote direction locked after first vote (YES or NO, not both)
 * - Multiple vote transactions allowed (incremental voting)
 * - Token balances per voter per proposal
 */
contract QuadraticVoting {
    // ============ Enums ============
    
    /// @notice Voting type enum (for compatibility, this contract only uses QUADRATIC)
    enum VotingType { SIMPLE, QUADRATIC }

    // ============ Structs ============
    
    /// @notice Extended Proposal struct for quadratic voting
    struct QuadraticProposal {
        uint256 id;
        string title;
        uint256 startTime;
        uint256 endTime;
        uint256 yesVotes;      // Total YES votes cast (not tokens)
        uint256 noVotes;       // Total NO votes cast (not tokens)
        uint256 baseTokens;    // Base tokens for distribution (default: 100)
        bool exists;
    }

    // ============ State Variables ============
    
    /// @notice The admin address (contract deployer)
    address public admin;

    /// @notice Mapping of shareholder addresses to their share count
    mapping(address => uint256) public shares;

    /// @notice Counter for proposal IDs
    uint256 public proposalCount;

    /// @notice Mapping of proposal ID to QuadraticProposal
    mapping(uint256 => QuadraticProposal) public proposals;

    /// @notice Token balances: proposalId => voterAddress => remaining tokens
    mapping(uint256 => mapping(address => uint256)) public voterTokens;

    /// @notice Vote direction locked: proposalId => voterAddress => direction (true=YES, false=NO)
    mapping(uint256 => mapping(address => bool)) public voteDirection;
    
    /// @notice Has voted at least once: proposalId => voterAddress => hasVoted
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    /// @notice Total tokens spent: proposalId => voterAddress => tokens used
    mapping(uint256 => mapping(address => uint256)) public tokensSpent;

    /// @notice Total votes cast: proposalId => voterAddress => votes
    mapping(uint256 => mapping(address => uint256)) public votesCast;

    /// @notice Mapping to store tie resolution type for proposals
    /// @dev proposalId => resolutionType (e.g., "STATUS_QUO_REJECT", "CHAIRPERSON_YES", "CHAIRPERSON_NO")
    mapping(uint256 => string) public tieResolution;

    // ============ Events ============
    
    /// @notice Emitted when the contract is deployed
    event ContractDeployed(address indexed admin, uint256 timestamp);

    /// @notice Emitted when a shareholder is added
    event ShareholderAdded(address indexed shareholder, uint256 shares);

    /// @notice Emitted when a quadratic proposal is created
    event QuadraticProposalCreated(
        uint256 indexed proposalId, 
        string title, 
        uint256 startTime, 
        uint256 endTime,
        uint256 baseTokens
    );

    /// @notice Emitted when voter tokens are initialized
    event VoterTokensInitialized(
        uint256 indexed proposalId, 
        address indexed voter, 
        uint256 tokens
    );

    /// @notice Emitted when a quadratic vote is cast
    event QuadraticVoteCast(
        uint256 indexed proposalId, 
        address indexed voter, 
        bool support, 
        uint256 voteCount,
        uint256 tokensCost,
        uint256 remainingTokens
    );

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

    /// @notice Creates a new quadratic voting proposal
    /// @param _title The title of the proposal
    /// @param _startTime The start time of voting (unix timestamp)
    /// @param _endTime The end time of voting (unix timestamp)
    /// @param _baseTokens The base token pool for distribution (default: 100)
    /// @return The new proposal ID
    function createQuadraticProposal(
        string memory _title,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _baseTokens
    ) public onlyAdmin returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_startTime < _endTime, "Start time must be before end time");
        
        proposalCount++;
        uint256 proposalId = proposalCount;
        
        // Use default of 100 if 0 is passed
        uint256 baseTokens = _baseTokens > 0 ? _baseTokens : 100;
        
        proposals[proposalId] = QuadraticProposal({
            id: proposalId,
            title: _title,
            startTime: _startTime,
            endTime: _endTime,
            yesVotes: 0,
            noVotes: 0,
            baseTokens: baseTokens,
            exists: true
        });
        
        emit QuadraticProposalCreated(proposalId, _title, _startTime, _endTime, baseTokens);
        
        return proposalId;
    }

    /// @notice Gets a proposal by ID
    /// @param _proposalId The ID of the proposal
    /// @return The proposal struct
    function getProposal(uint256 _proposalId) public view returns (QuadraticProposal memory) {
        require(proposals[_proposalId].exists, "Proposal does not exist");
        return proposals[_proposalId];
    }

    /// @notice Checks if voting is currently open for a proposal
    /// @param _proposalId The ID of the proposal
    /// @return True if voting is open
    function isVotingOpen(uint256 _proposalId) public view returns (bool) {
        QuadraticProposal memory proposal = proposals[_proposalId];
        if (!proposal.exists) return false;
        return block.timestamp >= proposal.startTime && block.timestamp <= proposal.endTime;
    }

    // ============ Token Management ============

    /// @notice Initialize voter tokens for a proposal
    /// @dev Must be called by admin before voting begins
    /// @param _proposalId The ID of the proposal
    /// @param _voter The voter address
    /// @param _tokens The number of tokens to allocate
    function initializeVoterTokens(
        uint256 _proposalId,
        address _voter,
        uint256 _tokens
    ) public onlyAdmin {
        require(proposals[_proposalId].exists, "Proposal does not exist");
        require(_voter != address(0), "Invalid voter address");
        require(voterTokens[_proposalId][_voter] == 0, "Tokens already initialized");
        require(_tokens > 0, "Tokens must be greater than 0");
        
        voterTokens[_proposalId][_voter] = _tokens;
        
        emit VoterTokensInitialized(_proposalId, _voter, _tokens);
    }

    /// @notice Batch initialize voter tokens
    /// @param _proposalId The ID of the proposal
    /// @param _voters Array of voter addresses
    /// @param _tokens Array of token amounts
    function batchInitializeVoterTokens(
        uint256 _proposalId,
        address[] memory _voters,
        uint256[] memory _tokens
    ) public onlyAdmin {
        require(_voters.length == _tokens.length, "Arrays must have same length");
        require(_voters.length > 0, "Arrays cannot be empty");
        
        for (uint256 i = 0; i < _voters.length; i++) {
            if (voterTokens[_proposalId][_voters[i]] == 0 && _tokens[i] > 0) {
                voterTokens[_proposalId][_voters[i]] = _tokens[i];
                emit VoterTokensInitialized(_proposalId, _voters[i], _tokens[i]);
            }
        }
    }

    /// @notice Get remaining tokens for a voter on a proposal
    /// @param _proposalId The ID of the proposal
    /// @param _voter The voter address
    /// @return The remaining token balance
    function getRemainingTokens(uint256 _proposalId, address _voter) 
        public view returns (uint256) 
    {
        return voterTokens[_proposalId][_voter];
    }

    /// @notice Get tokens spent by a voter on a proposal
    /// @param _proposalId The ID of the proposal
    /// @param _voter The voter address
    /// @return The tokens spent
    function getTokensSpent(uint256 _proposalId, address _voter) 
        public view returns (uint256) 
    {
        return tokensSpent[_proposalId][_voter];
    }

    /// @notice Get votes cast by a voter on a proposal
    /// @param _proposalId The ID of the proposal
    /// @param _voter The voter address
    /// @return The number of votes cast
    function getVotesCast(uint256 _proposalId, address _voter) 
        public view returns (uint256) 
    {
        return votesCast[_proposalId][_voter];
    }

    // ============ Cost Calculation ============

    /// @notice Calculate cost for additional votes using quadratic formula
    /// @dev Cost formula: (currentVotes + additionalVotes)² - currentVotes²
    /// @param _currentVotes Current votes already cast
    /// @param _additionalVotes Number of new votes to cast
    /// @return The token cost for the additional votes
    function calculateVoteCost(uint256 _currentVotes, uint256 _additionalVotes) 
        public pure returns (uint256) 
    {
        uint256 newTotal = _currentVotes + _additionalVotes;
        return (newTotal * newTotal) - (_currentVotes * _currentVotes);
    }

    /// @notice Calculate maximum votes affordable with remaining tokens
    /// @param _proposalId The proposal ID
    /// @param _voter The voter address
    /// @return maxVotes The maximum additional votes the voter can afford
    function getMaxAffordableVotes(uint256 _proposalId, address _voter) 
        public view returns (uint256 maxVotes) 
    {
        uint256 remainingTokens = voterTokens[_proposalId][_voter];
        uint256 currentVotes = votesCast[_proposalId][_voter];
        
        // Binary search for max affordable votes
        uint256 low = 0;
        uint256 high = 100; // Reasonable upper bound
        
        while (low < high) {
            uint256 mid = (low + high + 1) / 2;
            uint256 cost = calculateVoteCost(currentVotes, mid);
            
            if (cost <= remainingTokens) {
                low = mid;
            } else {
                high = mid - 1;
            }
        }
        
        return low;
    }

    // ============ Voting ============

    /// @notice Cast a quadratic vote on a proposal
    /// @dev Can be called multiple times, but direction is locked after first vote
    /// @param _proposalId The ID of the proposal to vote on
    /// @param _support True for YES, false for NO
    /// @param _voteCount Number of votes to cast (cost = increases quadratically)
    function castQuadraticVote(
        uint256 _proposalId,
        bool _support,
        uint256 _voteCount
    ) public {
        QuadraticProposal storage proposal = proposals[_proposalId];
        
        // Validations
        require(proposal.exists, "Proposal does not exist");
        require(isVotingOpen(_proposalId), "Voting is not open");
        require(_voteCount > 0, "Must cast at least 1 vote");
        require(voterTokens[_proposalId][msg.sender] > 0 || 
                tokensSpent[_proposalId][msg.sender] > 0, 
                "Voter tokens not initialized");

        // Lock vote direction after first vote
        if (hasVoted[_proposalId][msg.sender]) {
            require(voteDirection[_proposalId][msg.sender] == _support, 
                "Cannot change vote direction after first vote");
        } else {
            // First vote - lock direction
            voteDirection[_proposalId][msg.sender] = _support;
            hasVoted[_proposalId][msg.sender] = true;
        }

        // Calculate cost using quadratic formula
        uint256 currentVotes = votesCast[_proposalId][msg.sender];
        uint256 cost = calculateVoteCost(currentVotes, _voteCount);
        
        require(voterTokens[_proposalId][msg.sender] >= cost, 
            "Insufficient tokens for this many votes");

        // Deduct tokens and record votes
        voterTokens[_proposalId][msg.sender] -= cost;
        tokensSpent[_proposalId][msg.sender] += cost;
        votesCast[_proposalId][msg.sender] += _voteCount;

        // Add votes to proposal tally
        if (_support) {
            proposal.yesVotes += _voteCount;
        } else {
            proposal.noVotes += _voteCount;
        }

        emit QuadraticVoteCast(
            _proposalId, 
            msg.sender, 
            _support, 
            _voteCount,
            cost,
            voterTokens[_proposalId][msg.sender]
        );
    }

    /// @notice Check if a voter has voted on a proposal
    /// @param _proposalId The ID of the proposal
    /// @param _voter The voter address
    /// @return True if the voter has cast at least one vote
    function hasVotedOnProposal(uint256 _proposalId, address _voter) 
        public view returns (bool) 
    {
        return hasVoted[_proposalId][_voter];
    }

    /// @notice Get the vote direction of a voter (only valid if hasVoted is true)
    /// @param _proposalId The ID of the proposal
    /// @param _voter The voter address
    /// @return True for YES, false for NO
    function getVoteDirection(uint256 _proposalId, address _voter) 
        public view returns (bool) 
    {
        require(hasVoted[_proposalId][_voter], "Voter has not voted");
        return voteDirection[_proposalId][_voter];
    }

    // ============ Result Retrieval ============

    /// @notice Gets the result of a quadratic voting proposal
    /// @param _proposalId The ID of the proposal
    /// @return title The title of the proposal
    /// @return yesVotes The total YES votes
    /// @return noVotes The total NO votes
    /// @return votingOpen Whether voting is currently open
    /// @return baseTokens The base token pool
    function getProposalResult(uint256 _proposalId) public view returns (
        string memory title,
        uint256 yesVotes,
        uint256 noVotes,
        bool votingOpen,
        uint256 baseTokens
    ) {
        require(proposals[_proposalId].exists, "Proposal does not exist");
        
        QuadraticProposal memory proposal = proposals[_proposalId];
        
        return (
            proposal.title,
            proposal.yesVotes,
            proposal.noVotes,
            isVotingOpen(_proposalId),
            proposal.baseTokens
        );
    }

    /// @notice Get voter's complete status on a proposal
    /// @param _proposalId The proposal ID
    /// @param _voter The voter address
    /// @return hasVotedYet Whether voter has cast any votes
    /// @return direction Vote direction (only valid if hasVotedYet is true)
    /// @return totalVotes Total votes cast by this voter
    /// @return totalSpent Total tokens spent
    /// @return remaining Remaining tokens
    function getVoterStatus(uint256 _proposalId, address _voter) 
        public view returns (
            bool hasVotedYet,
            bool direction,
            uint256 totalVotes,
            uint256 totalSpent,
            uint256 remaining
        ) 
    {
        return (
            hasVoted[_proposalId][_voter],
            voteDirection[_proposalId][_voter],
            votesCast[_proposalId][_voter],
            tokensSpent[_proposalId][_voter],
            voterTokens[_proposalId][_voter]
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
