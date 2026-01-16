# Quadratic Voting Implementation Plan

> [!CAUTION]
> **AGENT DIRECTIVE**: Before implementing ANY change, you MUST:
> 1. **THINK** - Understand the current codebase thoroughly
> 2. **PLAN** - Document exactly what you will change and why
> 3. **VERIFY EXISTING** - Run all existing tests to establish a baseline
> 4. **IMPLEMENT** - Make changes incrementally
> 5. **VALIDATE** - Confirm existing functionality still works
> 
> **DO NOT PROCEED to the next phase without completing ALL steps in the current phase.**

---

## Overview

Adding **quadratic voting** capability to the SME Voting System while maintaining **FULL backward compatibility** with the existing simple voting mechanism. Shareholders will receive voting tokens proportional to their shares, and spending tokens will follow the n² cost function.

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Cost Model | **n² total cost** | 3 votes cost 9 tokens total |
| Token Pool | **100 × share ratio** | Clean math, easy UI |
| Vote Direction | **Single direction** | YES or NO, not both |
| Compatibility | **Proposal-level toggle** | `votingType: 'simple' \| 'quadratic'` |
| Token Persistence | **Per-proposal** | Fresh allocation each time |

---

## 🛡️ Critical Safety Guidelines

> [!IMPORTANT]
> ### Non-Negotiable Rules for Implementation
> 
> 1. **NEVER modify existing function signatures** - Only ADD new optional parameters with defaults
> 2. **NEVER delete existing code paths** - Simple voting MUST continue working
> 3. **ALL new fields MUST have default values** - Ensures backward compatibility
> 4. **Regression tests BEFORE new features** - Run existing test suite before ANY change
> 5. **Feature flags/conditional paths** - Quadratic voting is ADDITIVE, not REPLACEMENT
> 6. **Database migrations MUST be reversible** - Always plan for rollback

### Default Values Summary

| Layer | Field | Default Value | Purpose |
|-------|-------|---------------|---------|
| Database | `votingType` | `'simple'` | Existing proposals stay simple |
| Database | `baseTokens` | `100` | Default token pool |
| Database | `voteWeight` | `1` | Simple voting compatibility |
| Database | `tokensSpent` | `0` | No tokens for simple voting |
| Backend | `votingType` param | `'simple'` | API backward compatibility |
| Backend | `voteCount` param | `1` | Single vote for simple voting |
| Smart Contract | `votingType` | `0 (SIMPLE)` | Default to simple mode |

---

# Phase-Wise Execution Plan

## Phase 0: Pre-Implementation Baseline (MANDATORY)

> [!CAUTION]
> **DO NOT SKIP THIS PHASE** - Establish baseline before ANY changes.

### Goals
- [ ] Document current system state
- [ ] Run and record all existing tests
- [ ] Create baseline test snapshots

### Steps

#### 0.1 - Document Current State
```bash
# Take note of current test status
cd sme-voting-system/backend && npm test
cd sme-voting-system/smart-contracts && npx hardhat test
cd sme-voting-system/frontend && npm test
```

#### 0.2 - Create Baseline Test Snapshot
```bash
# Record current test results to compare against later
npm test 2>&1 | tee baseline-test-results.txt
```

#### 0.3 - Verify Core Functionality Works
- [ ] Admin can create simple proposal
- [ ] Shareholders can vote on proposal
- [ ] Results are displayed correctly
- [ ] Blockchain transactions complete

### Exit Criteria
✅ All existing tests pass  
✅ Baseline results documented  
✅ Core functionality verified manually

---

## Phase 1: Database Schema Updates

> [!WARNING]
> **Database changes affect ALL layers.** Proceed with extreme caution.

### Goals
- [ ] Add new columns with safe defaults
- [ ] Create new VoterTokenBalance table
- [ ] Ensure existing data remains intact

### Changes

#### 1.1 - [MODIFY] [schema.prisma](file:///d:/evoting/sme-voting-system/backend/prisma/schema.prisma)

**ADD to Proposal model** (do NOT modify existing fields):
```prisma
model Proposal {
  // ... existing fields unchanged ...
  
  // NEW: Quadratic voting support
  votingType  String   @default("simple") @map("voting_type") @db.VarChar(20)
  baseTokens  Int      @default(100) @map("base_tokens")
  voterTokens VoterTokenBalance[]
}
```

**ADD to Vote model** (do NOT remove unique constraint yet):
```prisma
model Vote {
  // ... existing fields unchanged ...
  
  // NEW: Quadratic voting fields with SAFE DEFAULTS
  voteWeight    Int     @default(1) @map("vote_weight")      // Default 1 for simple
  tokensSpent   Int     @default(0) @map("tokens_spent")     // Default 0 for simple
}
```

**ADD new model**:
```prisma
model VoterTokenBalance {
  id            Int         @id @default(autoincrement())
  shareholderId Int         @map("shareholder_id")
  proposalId    Int         @map("proposal_id")
  totalTokens   Int         @map("total_tokens")
  tokensUsed    Int         @default(0) @map("tokens_used")
  voteDirection Boolean?    @map("vote_direction")  // null = not voted
  createdAt     DateTime    @default(now()) @map("created_at")
  updatedAt     DateTime    @updatedAt @map("updated_at")
  
  shareholder   Shareholder @relation(fields: [shareholderId], references: [id], onDelete: Cascade)
  proposal      Proposal    @relation(fields: [proposalId], references: [proposalId], onDelete: Cascade)
  
  @@unique([shareholderId, proposalId])
  @@map("voter_token_balances")
}
```

#### 1.2 - Migration Commands
```bash
cd backend
npx prisma migrate dev --name add_quadratic_voting_support
```

### Regression Check (MANDATORY)
```bash
# After migration, verify existing functionality
npm test
# Verify simple proposal creation still works
# Verify simple voting still works
```

### Exit Criteria
✅ Migration applied successfully  
✅ All existing tests still pass  
✅ Existing proposals accessible and functional  
✅ Simple voting flow unchanged

---

## Phase 2: Smart Contracts

> [!IMPORTANT]
> **Deploy NEW contract - DO NOT modify existing Voting.sol behavior**

### Goals
- [ ] Create new QuadraticVoting.sol contract
- [ ] Keep existing Voting.sol untouched (or minimal safe additions)
- [ ] Test both contracts work independently

### Changes

#### 2.1 - [NEW] [QuadraticVoting.sol](file:///d:/evoting/sme-voting-system/smart-contracts/contracts/QuadraticVoting.sol)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title QuadraticVoting
 * @notice Separate contract for quadratic voting - does NOT modify existing voting
 */
contract QuadraticVoting {
    // Voting type enum
    enum VotingType { SIMPLE, QUADRATIC }

    // Extended Proposal struct for quadratic voting
    struct QuadraticProposal {
        uint256 id;
        string title;
        uint256 startTime;
        uint256 endTime;
        uint256 yesVotes;      // Total YES voting power (√tokens spent)
        uint256 noVotes;       // Total NO voting power (√tokens spent)
        VotingType votingType;
        uint256 baseTokens;    // Base tokens for distribution (default: 100)
        bool exists;
    }

    // Token balances: proposalId => voterAddress => remaining tokens
    mapping(uint256 => mapping(address => uint256)) public voterTokens;

    // Vote direction locked: proposalId => voterAddress => direction (true=YES, false=NO)
    mapping(uint256 => mapping(address => bool)) public voteDirection;
    
    // Has voted: proposalId => voterAddress => hasVoted
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // Tokens spent: proposalId => voterAddress => tokens used
    mapping(uint256 => mapping(address => uint256)) public tokensSpent;

    // Proposals
    mapping(uint256 => QuadraticProposal) public proposals;
    uint256 public proposalCount;

    // Admin
    address public admin;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // Create a quadratic voting proposal
    function createQuadraticProposal(
        string memory _title,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _baseTokens
    ) public onlyAdmin returns (uint256) {
        proposalCount++;
        proposals[proposalCount] = QuadraticProposal({
            id: proposalCount,
            title: _title,
            startTime: _startTime,
            endTime: _endTime,
            yesVotes: 0,
            noVotes: 0,
            votingType: VotingType.QUADRATIC,
            baseTokens: _baseTokens > 0 ? _baseTokens : 100, // Default: 100
            exists: true
        });
        return proposalCount;
    }

    // Initialize voter tokens
    function initializeVoterTokens(
        uint256 _proposalId,
        address _voter,
        uint256 _tokens
    ) public onlyAdmin {
        require(proposals[_proposalId].exists, "Proposal does not exist");
        require(voterTokens[_proposalId][_voter] == 0, "Already initialized");
        voterTokens[_proposalId][_voter] = _tokens;
    }

    // Cast quadratic vote - can be called multiple times
    function castQuadraticVote(
        uint256 _proposalId,
        bool _support,
        uint256 _voteCount
    ) public {
        QuadraticProposal storage proposal = proposals[_proposalId];
        require(proposal.exists, "Proposal does not exist");
        require(block.timestamp >= proposal.startTime, "Voting not started");
        require(block.timestamp <= proposal.endTime, "Voting ended");
        require(_voteCount > 0, "Must cast at least 1 vote");

        // Lock vote direction after first vote
        if (hasVoted[_proposalId][msg.sender]) {
            require(voteDirection[_proposalId][msg.sender] == _support, 
                "Cannot change vote direction");
        } else {
            voteDirection[_proposalId][msg.sender] = _support;
            hasVoted[_proposalId][msg.sender] = true;
        }

        // Calculate cost
        uint256 currentVotes = _getCurrentVotes(_proposalId, msg.sender);
        uint256 cost = calculateVoteCost(currentVotes, _voteCount);
        
        require(voterTokens[_proposalId][msg.sender] >= cost, 
            "Insufficient tokens");

        // Deduct tokens
        voterTokens[_proposalId][msg.sender] -= cost;
        tokensSpent[_proposalId][msg.sender] += cost;

        // Add voting power (using voting power, not raw votes)
        if (_support) {
            proposal.yesVotes += _voteCount;
        } else {
            proposal.noVotes += _voteCount;
        }
    }

    // Get current votes cast by voter
    function _getCurrentVotes(uint256 _proposalId, address _voter) 
        internal view returns (uint256) 
    {
        // votes = sqrt(tokensSpent) approximately
        // For simplicity, we track votes directly
        return _sqrt(tokensSpent[_proposalId][_voter]);
    }

    // Calculate cost for N additional votes
    // Cost formula: (currentVotes + additionalVotes)² - currentVotes²
    function calculateVoteCost(uint256 _currentVotes, uint256 _additionalVotes) 
        public pure returns (uint256) 
    {
        uint256 newTotal = _currentVotes + _additionalVotes;
        return (newTotal * newTotal) - (_currentVotes * _currentVotes);
    }

    // Get remaining tokens
    function getRemainingTokens(uint256 _proposalId, address _voter) 
        public view returns (uint256) 
    {
        return voterTokens[_proposalId][_voter];
    }

    // Integer square root (Babylonian method)
    function _sqrt(uint256 x) internal pure returns (uint256 y) {
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }
}
```

#### 2.2 - [MODIFY] [Voting.sol](file:///d:/evoting/sme-voting-system/smart-contracts/contracts/Voting.sol) - MINIMAL CHANGES ONLY

> [!WARNING]
> **Only add new fields with defaults. DO NOT change existing function behavior.**

```diff
  struct Proposal {
      uint256 id;
      string title;
      uint256 startTime;
      uint256 endTime;
      uint256 yesVotes;
      uint256 noVotes;
+     uint8 votingType;     // 0 = SIMPLE (default), 1 = QUADRATIC
+     uint256 baseTokens;   // For quadratic: base tokens (default: 100)
      bool exists;
  }

  // Existing vote() function UNCHANGED
  // Existing createProposal() function UNCHANGED - or add optional params with defaults
```

### Regression Check (MANDATORY)
```bash
cd smart-contracts
npx hardhat test  # ALL existing tests must pass
```

### Exit Criteria
✅ QuadraticVoting.sol compiles and deploys  
✅ Existing Voting.sol tests still pass  
✅ Both contracts can be deployed independently

---

## Phase 3: Backend Services

> [!IMPORTANT]
> **Create NEW service file. Modify existing services ONLY to add optional parameters with defaults.**

### Goals
- [ ] Create QuadraticVotingService
- [ ] Add optional parameters to existing services
- [ ] Maintain 100% backward compatibility on existing endpoints

### Changes

#### 3.1 - [NEW] [quadratic-voting.service.ts](file:///d:/evoting/sme-voting-system/backend/src/services/quadratic-voting.service.ts)

```typescript
/**
 * QuadraticVotingService
 * 
 * IMPORTANT: This service handles ONLY quadratic voting logic.
 * Simple voting continues to use the existing voting.service.ts UNCHANGED.
 */
export class QuadraticVotingService {
  
  /**
   * Calculate tokens for a shareholder on a proposal
   * Formula: baseTokens × (shareholderShares / totalShares)
   */
  async calculateVoterTokens(
    proposalId: number, 
    shareholderId: number
  ): Promise<number> {
    const proposal = await prisma.proposal.findUnique({ 
      where: { proposalId } 
    });
    
    if (!proposal || proposal.votingType !== 'quadratic') {
      throw new Error('Proposal is not quadratic voting type');
    }
    
    const shareholder = await prisma.shareholder.findUnique({
      where: { id: shareholderId },
      include: { shares: true }
    });
    
    const totalShares = await prisma.share.aggregate({ 
      _sum: { shares: true } 
    });
    
    const ratio = (shareholder?.shares?.shares ?? 0) / 
                  (totalShares._sum.shares ?? 1);
    return Math.floor((proposal.baseTokens ?? 100) * ratio);
  }
  
  /**
   * Get or create token balance for voter
   */
  async getOrCreateTokenBalance(
    proposalId: number, 
    shareholderId: number
  ): Promise<VoterTokenBalance> {
    let balance = await prisma.voterTokenBalance.findUnique({
      where: {
        shareholderId_proposalId: { shareholderId, proposalId }
      }
    });
    
    if (!balance) {
      const tokens = await this.calculateVoterTokens(proposalId, shareholderId);
      balance = await prisma.voterTokenBalance.create({
        data: {
          shareholderId,
          proposalId,
          totalTokens: tokens,
          tokensUsed: 0,      // Default: 0
          voteDirection: null  // Default: null (not voted yet)
        }
      });
    }
    
    return balance;
  }
  
  /**
   * Calculate cost for additional votes
   * Formula: (current + additional)² - current²
   */
  calculateVoteCost(currentVotes: number, additionalVotes: number): number {
    const newTotal = currentVotes + additionalVotes;
    return (newTotal * newTotal) - (currentVotes * currentVotes);
  }
  
  /**
   * Cast quadratic vote
   */
  async castQuadraticVote(
    walletAddress: string,
    proposalId: number,
    voteChoice: boolean,
    voteCount: number = 1  // Default: 1 vote
  ): Promise<QuadraticVoteResult> {
    // Implementation...
  }

  /**
   * Calculate voting power from tokens spent
   */
  calculateVotingPower(tokensSpent: number): number {
    return Math.sqrt(tokensSpent);
  }
}
```

#### 3.2 - [MODIFY] [proposal.service.ts](file:///d:/evoting/sme-voting-system/backend/src/services/proposal.service.ts)

> [!WARNING]
> **ONLY add optional parameters with defaults. DO NOT change existing behavior.**

```diff
  async createProposal(
    title: string,
    description: string | undefined,
    startTime: Date | number,
-   endTime: Date | number
+   endTime: Date | number,
+   votingType: 'simple' | 'quadratic' = 'simple',  // Default: simple
+   baseTokens: number = 100                         // Default: 100
  ): Promise<{
    proposal: Proposal;
    blockchainTx?: string;
  }> {
    // Existing code UNCHANGED for simple voting
    
+   // Add new fields to database create
+   const proposal = await prisma.proposal.create({
+     data: {
+       // ... existing fields ...
+       votingType: votingType,     // Will default to 'simple'
+       baseTokens: baseTokens,     // Will default to 100
+     }
+   });
  }
```

#### 3.3 - [MODIFY] [voting.service.ts](file:///d:/evoting/sme-voting-system/backend/src/services/voting.service.ts)

> [!WARNING]
> **ONLY add routing logic. Simple voting path MUST remain UNCHANGED.**

```diff
  async castVote(
    walletAddress: string,
    proposalId: number,
-   voteChoice: boolean
+   voteChoice: boolean,
+   voteCount: number = 1  // Default: 1 for backward compatibility
  ): Promise<{
    vote: Vote;
    blockchainTx?: string;
+   tokensSpent?: number;        // Only for quadratic
+   remainingTokens?: number;    // Only for quadratic
  }> {
+   // CRITICAL: Check voting type and route accordingly
+   const proposal = await prisma.proposal.findUnique({ 
+     where: { proposalId } 
+   });
+   
+   // SIMPLE VOTING PATH - UNCHANGED
+   if (!proposal || proposal.votingType === 'simple') {
      // === EXISTING SIMPLE VOTING CODE - DO NOT MODIFY ===
      // ... all existing code stays here ...
+   }
+   
+   // QUADRATIC VOTING PATH - NEW
+   else if (proposal.votingType === 'quadratic') {
+     return this.quadraticVotingService.castQuadraticVote(
+       walletAddress, proposalId, voteChoice, voteCount
+     );
+   }
  }
```

### Regression Check (MANDATORY)
```bash
cd backend
npm test  # ALL existing tests must pass

# Specifically test simple voting still works:
# POST /api/vote with existing format
# GET /api/proposals returns results correctly
```

### Exit Criteria
✅ All existing API endpoints work unchanged  
✅ Simple voting tests pass  
✅ New quadratic endpoints functional  
✅ No breaking changes to API response formats

---

## Phase 4: API Endpoints

### Goals
- [ ] Add new endpoints for quadratic voting
- [ ] Keep existing endpoints UNCHANGED
- [ ] Maintain API version compatibility

### New Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/proposals/:id/token-balance` | ✅ | Get voter's token balance |
| POST | `/api/vote/quadratic` | ✅ | Cast quadratic vote |
| GET | `/api/vote/cost-preview` | ✅ | Preview cost for N votes |

### Unchanged Endpoints (MUST STILL WORK)

| Method | Endpoint | Behavior |
|--------|----------|----------|
| GET | `/api/proposals` | Returns all proposals (with new fields as optional) |
| GET | `/api/proposals/:id` | Returns proposal (with new fields) |
| POST | `/api/proposals` | Creates proposal (new fields optional, defaults applied) |
| POST | `/api/vote` | Casts simple vote (unchanged for simple proposals) |

### Exit Criteria
✅ Existing API tests pass  
✅ New endpoints functional  
✅ API documentation updated

---

## Phase 5: Frontend Components

### Goals
- [ ] Create new QuadraticVoteModal
- [ ] Add voting type to CreateProposalForm
- [ ] Conditional rendering based on voting type
- [ ] Keep existing UI working for simple proposals

### Changes

#### 5.1 - [NEW] [QuadraticVoteModal.tsx](file:///d:/evoting/sme-voting-system/frontend/src/components/QuadraticVoteModal.tsx)

**UI Mockup:**
```
┌─────────────────────────────────────────┐
│  Cast Your Vote (Quadratic)          ✕  │
├─────────────────────────────────────────┤
│  📊 Proposal: Budget Allocation 2025    │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 🪙 Your Tokens: 35 / 50 remaining │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Vote Direction:  [ YES ✓ ] [ NO ]      │
│  (Locked after first vote)              │
│                                         │
│  How many votes?                        │
│  ┌─────────────────────────────────┐   │
│  │  ◀  [====●=====]  ▶   3 votes   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Cost Breakdown:                   │  │
│  │ Current votes: 2 (4 tokens spent) │  │
│  │ + 3 more votes: 21 tokens         │  │
│  │ New total: 5 votes (25 tokens)    │  │
│  │                                   │  │
│  │ ⚡ Voting Power: √25 = 5.0        │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ⚠️ Votes cannot be undone once cast   │
│                                         │
├─────────────────────────────────────────┤
│              [Cancel]  [Cast 3 Votes]   │
└─────────────────────────────────────────┘
```

#### 5.2 - [MODIFY] [CreateProposalForm.tsx](file:///d:/evoting/sme-voting-system/frontend/src/components/CreateProposalForm.tsx)

```tsx
// ADD voting type selector - form still works without it (defaults to simple)
<div className="form-group">
  <label>Voting Type</label>
  <div className="voting-type-selector">
    <button 
      type="button"
      className={`type-btn ${votingType === 'simple' ? 'active' : ''}`}
      onClick={() => setVotingType('simple')}
    >
      📋 Simple Voting
      <span>1 share = 1 vote</span>
    </button>
    <button 
      type="button"
      className={`type-btn ${votingType === 'quadratic' ? 'active' : ''}`}
      onClick={() => setVotingType('quadratic')}
    >
      📊 Quadratic Voting
      <span>Cost = votes²</span>
    </button>
  </div>
</div>

{/* Only show for quadratic */}
{votingType === 'quadratic' && (
  <div className="form-group">
    <label>Base Token Pool</label>
    <input 
      type="number" 
      value={baseTokens} 
      onChange={(e) => setBaseTokens(Number(e.target.value))}
      min={10}
      max={1000}
      defaultValue={100}  // Safe default
    />
    <small>Tokens distributed proportionally by shares</small>
  </div>
)}
```

#### 5.3 - [MODIFY] [ProposalCard.tsx](file:///d:/evoting/sme-voting-system/frontend/src/components/ProposalCard.tsx)

```tsx
// ADD badge - doesn't break if votingType is undefined
<div className="proposal-header">
  <h3>{proposal.title}</h3>
  <span className={`voting-type-badge ${proposal.votingType || 'simple'}`}>
    {proposal.votingType === 'quadratic' ? '📊 Quadratic' : '📋 Simple'}
  </span>
</div>
```

#### 5.4 - Conditional Modal Rendering

```tsx
// In VoteButton or similar component
{proposal.votingType === 'quadratic' ? (
  <QuadraticVoteModal proposal={proposal} />
) : (
  <VoteModal proposal={proposal} />  // Existing modal unchanged
)}
```

### Regression Check (MANDATORY)
```bash
cd frontend
npm test  # ALL existing tests must pass
npm run build  # Build must succeed
```

### Exit Criteria
✅ Simple voting UI unchanged  
✅ Quadratic modal works  
✅ Create form works with both types  
✅ All frontend tests pass

---

## Phase 6: Integration Testing

### Goals
- [ ] End-to-end testing of both voting types
- [ ] Verify backward compatibility
- [ ] Performance testing

### Test Cases

#### 6.1 - Simple Voting Regression (CRITICAL)
```
1. Create simple proposal via API (no votingType param)
   - VERIFY: votingType defaults to 'simple'
   - VERIFY: baseTokens defaults to 100
2. Cast vote via existing /api/vote endpoint
   - VERIFY: Vote recorded correctly
3. View results
   - VERIFY: Results display correctly
```

#### 6.2 - Quadratic Voting Flow
```
1. Create quadratic proposal
2. Verify token balances calculated
3. Cast multiple votes
4. Verify cost deduction
5. Verify voting power calculation
```

#### 6.3 - Mixed Proposals
```
1. Create one simple and one quadratic proposal
2. Verify correct modal opens for each
3. Verify votes work correctly for each
```

### Exit Criteria
✅ All regression tests pass  
✅ Quadratic voting flow works  
✅ No performance degradation

---

## Phase 7: Deployment & Rollback Plan

### Deployment Steps
1. Deploy database migration
2. Deploy smart contract
3. Deploy backend
4. Deploy frontend

### Rollback Plan (If Issues Occur)

#### Database
```bash
npx prisma migrate revert  # Revert last migration
```

#### Smart Contract
- Keep existing Voting.sol active
- QuadraticVoting.sol can be disabled without affecting simple voting

#### Backend
- Revert to previous deployment
- All APIs remain backward compatible

#### Frontend
- Revert to previous deployment
- Simple voting continues working

---

## Files Summary

| Layer | Files Changed | New Files |
|-------|--------------|-----------|
| Smart Contracts | `Voting.sol` (minimal) | `QuadraticVoting.sol` |
| Database | `schema.prisma` | - |
| Backend | `proposal.service.ts`, `voting.service.ts` | `quadratic-voting.service.ts` |
| Frontend | `CreateProposalForm.tsx`, `ProposalCard.tsx` | `QuadraticVoteModal.tsx`, `TokenBalanceDisplay.tsx` |

---

## Estimated Effort

| Phase | Estimated Time |
|-------|---------------|
| Phase 0: Baseline | 30 min |
| Phase 1: Database | 1 hour |
| Phase 2: Smart Contracts | 2-3 hours |
| Phase 3: Backend | 2-3 hours |
| Phase 4: API Endpoints | 1 hour |
| Phase 5: Frontend | 3-4 hours |
| Phase 6: Integration Testing | 2-3 hours |
| Phase 7: Deployment | 1 hour |
| **Total** | **13-17 hours** |

---

## Agent Instructions Summary

> [!CAUTION]
> ### FOR THE IMPLEMENTING AGENT
> 
> **Before EACH phase:**
> 1. 🧠 **THINK** - Read and understand all existing code you'll touch
> 2. 📝 **PLAN** - Document your exact changes before coding
> 3. ✅ **TEST** - Run ALL existing tests to verify baseline
> 
> **During implementation:**
> 4. 🔒 **PRESERVE** - Never modify existing function signatures
> 5. 🔀 **SEPARATE** - Keep simple and quadratic code paths distinct
> 6. 🛡️ **DEFAULT** - Every new field MUST have a default value
> 
> **After EACH phase:**
> 7. 🧪 **VERIFY** - Run regression tests
> 8. 📊 **VALIDATE** - Confirm existing functionality unchanged
> 9. 📋 **DOCUMENT** - Update this plan with completion status
> 
> **If something breaks:**
> - STOP immediately
> - Revert changes
> - Investigate root cause
> - Only proceed when baseline tests pass again

### Code Path Separation Principle

```
┌─────────────────────────────────────────────────────────┐
│                    API Request                          │
│                         │                               │
│                         ▼                               │
│              ┌──────────────────┐                       │
│              │  Check votingType │                       │
│              └──────────────────┘                       │
│                    │         │                          │
│          'simple'  │         │  'quadratic'             │
│                    ▼         ▼                          │
│    ┌───────────────────┐  ┌───────────────────────┐    │
│    │ EXISTING CODE     │  │ NEW QUADRATIC CODE    │    │
│    │ (DO NOT MODIFY)   │  │ (Separate service)    │    │
│    └───────────────────┘  └───────────────────────┘    │
│                    │         │                          │
│                    ▼         ▼                          │
│              ┌──────────────────┐                       │
│              │  Unified Response │                       │
│              └──────────────────┘                       │
└─────────────────────────────────────────────────────────┘
```
