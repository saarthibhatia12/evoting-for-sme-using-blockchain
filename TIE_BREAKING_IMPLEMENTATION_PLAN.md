# Tie-Breaking Implementation Plan

> **Phase-Wise Execution Plan for Admin Choice Tie-Breaker**

---

## Overview

When a proposal ends with equal YES and NO votes, the Admin/Chairperson can:
1. **Reject (Status Quo)** – Proposal fails, no change.
2. **Cast Chairperson's Vote** – Admin casts the deciding YES or NO vote.

---

## Phase 0: Pre-Implementation Baseline

> ⚠️ **MANDATORY** – Do not skip.

### Goals
- [ ] Document current test status
- [ ] Verify existing voting flows work

### Steps
```bash
cd sme-voting-system/smart-contracts && npx hardhat test
cd sme-voting-system/backend && npm test
cd sme-voting-system/frontend && npm run build
```

### Exit Criteria
✅ All tests pass  
✅ Simple and Quadratic voting work end-to-end

---

## Phase 1: Database Schema Changes

### Goals
- [ ] Add tie-breaking fields to `Proposal` model
- [ ] Run migration

### Changes

#### [MODIFY] `backend/prisma/schema.prisma`

Add to `Proposal` model:
```prisma
model Proposal {
  // ... existing fields ...

  // Tie-breaking
  isTied              Boolean   @default(false) @map("is_tied")
  tieResolvedAt       DateTime? @map("tie_resolved_at")
  tieResolutionType   String?   @map("tie_resolution_type") @db.VarChar(30)
  tieResolvedByAdminId Int?     @map("tie_resolved_by_admin_id")
}
```

**Resolution Types**: `null`, `STATUS_QUO_REJECT`, `CHAIRPERSON_YES`, `CHAIRPERSON_NO`

### Commands
```bash
cd backend
npx prisma migrate dev --name add_tie_breaking
npx prisma generate
```

### Exit Criteria
✅ Migration applied  
✅ Prisma client regenerated  
✅ Existing data unaffected

---

## Phase 2: Backend Service

### Goals
- [ ] Create `TieResolutionService`
- [ ] Implement tie detection and resolution logic

### Changes

#### [NEW] `backend/src/services/tie-resolution.service.ts`

**Key Methods:**

| Method | Parameters | Description |
|--------|------------|-------------|
| `checkAndMarkTie` | `proposalId` | Mark proposal as tied if `yesVotes == noVotes` |
| `resolveWithStatusQuo` | `proposalId`, `adminId` | Set `tieResolutionType = 'STATUS_QUO_REJECT'` |
| `resolveWithChairpersonVote` | `proposalId`, `adminId`, `voteChoice` | Set `CHAIRPERSON_YES` or `CHAIRPERSON_NO` |
| `getFinalResult` | `proposalId` | Return `APPROVED`, `REJECTED`, or `TIE_PENDING` |

**Vote Tally Logic:**
- Simple: Sum of `voteWeight`
- Quadratic: Sum of `√tokensSpent`

### Exit Criteria
✅ Service compiles  
✅ Unit tests pass (if any)

---

## Phase 3: Backend Controller & Routes

### Goals
- [ ] Create controller for tie resolution endpoints
- [ ] Add routes to Express app

### Changes

#### [NEW] `backend/src/controllers/tie-resolution.controller.ts`

| Handler | Route | Method |
|---------|-------|--------|
| `checkTieStatus` | `/proposals/:id/tie-status` | GET |
| `resolveTieStatusQuo` | `/proposals/:id/resolve-tie/status-quo` | POST |
| `resolveTieChairpersonVote` | `/proposals/:id/resolve-tie/chairperson-vote` | POST |
| `getProposalResult` | `/proposals/:id/final-result` | GET |

#### [MODIFY] `backend/src/routes/index.ts`

Register new routes with `authenticate` and `requireAdmin` middleware.

### Testing
```bash
# Test tie status (replace :id)
curl http://localhost:3001/api/proposals/1/tie-status -H "Authorization: Bearer $JWT"

# Resolve via Status Quo
curl -X POST http://localhost:3001/api/proposals/1/resolve-tie/status-quo -H "Authorization: Bearer $JWT"

# Resolve via Chairperson Vote
curl -X POST http://localhost:3001/api/proposals/1/resolve-tie/chairperson-vote \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"voteChoice": true}'
```

### Exit Criteria
✅ All 4 endpoints respond correctly  
✅ Admin-only access enforced  
✅ Error handling for invalid requests

---

## Phase 4: Frontend API Service

### Goals
- [ ] Add API methods for tie resolution

### Changes

#### [MODIFY] `frontend/src/services/proposal.service.ts`

```typescript
async getFinalResult(proposalId: number) {
  return api.get(`/proposals/${proposalId}/final-result`);
}

async resolveTieStatusQuo(proposalId: number) {
  return api.post(`/proposals/${proposalId}/resolve-tie/status-quo`);
}

async resolveTieChairpersonVote(proposalId: number, voteChoice: boolean) {
  return api.post(`/proposals/${proposalId}/resolve-tie/chairperson-vote`, { voteChoice });
}
```

### Exit Criteria
✅ API methods callable from components

---

## Phase 5: Frontend Modal Component

### Goals
- [ ] Create `TieResolutionModal.tsx`
- [ ] Show 3 options: Reject, Vote YES, Vote NO

### Changes

#### [NEW] `frontend/src/components/TieResolutionModal.tsx`

**UI Layout:**
```
┌─────────────────────────────────────────┐
│  ⚖️ Tie-Breaker Required              ✕ │
├─────────────────────────────────────────┤
│  Proposal: [Title]                      │
│                                         │
│  ┌─────────┐   VS   ┌─────────┐         │
│  │ YES: 50 │        │ NO: 50  │         │
│  └─────────┘        └─────────┘         │
│                                         │
│  ○ 🚫 Reject (Status Quo)               │
│  ○ ✅ Chairperson Vote: YES             │
│  ○ ❌ Chairperson Vote: NO              │
│                                         │
├─────────────────────────────────────────┤
│           [Cancel]  [Confirm]           │
└─────────────────────────────────────────┘
```

#### [NEW] `frontend/src/components/TieResolutionModal.css`

Style the modal with consistent design.

### Exit Criteria
✅ Modal renders correctly  
✅ Radio buttons work  
✅ API calls succeed on confirm

---

## Phase 6: Integrate Modal into Results Page

### Goals
- [ ] Detect `TIE_PENDING` status
- [ ] Show modal to Admin
- [ ] Show "Awaiting decision" to Shareholders

### Changes

#### [MODIFY] `frontend/src/pages/ProposalDetail.tsx` (or Results component)

```tsx
// Fetch final result
const result = await proposalService.getFinalResult(proposalId);

// If tied and user is admin
if (result.status === 'TIE_PENDING' && user.isAdmin) {
  setShowTieModal(true);
}

// If tied and user is NOT admin
if (result.status === 'TIE_PENDING' && !user.isAdmin) {
  // Show: "Awaiting Chairperson's decision"
}
```

### Exit Criteria
✅ Admin sees modal on tied proposals  
✅ Shareholders see waiting message  
✅ Result updates after resolution

---

## Phase 7: Smart Contract (Optional)

### Goals
- [ ] Record tie resolution on-chain for transparency

### Changes

#### [MODIFY] `smart-contracts/contracts/Voting.sol`

```solidity
mapping(uint256 => string) public tieResolution;
event TieResolved(uint256 indexed proposalId, string resolutionType);

function resolveTie(uint256 _proposalId, string memory _type) public onlyAdmin {
    require(proposals[_proposalId].yesVotes == proposals[_proposalId].noVotes, "Not tied");
    tieResolution[_proposalId] = _type;
    emit TieResolved(_proposalId, _type);
}
```

### Exit Criteria
✅ Contract compiles  
✅ `resolveTie` callable by admin  
✅ Event emitted

---

## Phase 8: Integration Testing

### Test Cases

| # | Scenario | Expected Result |
|---|----------|-----------------|
| 1 | Create tied Simple proposal | Status = `TIE_PENDING` |
| 2 | Admin resolves with Status Quo | Status = `REJECTED`, Type = `STATUS_QUO_REJECT` |
| 3 | Admin resolves with YES vote | Status = `APPROVED`, Type = `CHAIRPERSON_YES` |
| 4 | Admin resolves with NO vote | Status = `REJECTED`, Type = `CHAIRPERSON_NO` |
| 5 | Non-admin tries to resolve | 403 Forbidden |
| 6 | Resolve before voting ends | 400 Bad Request |
| 7 | Resolve non-tied proposal | 400 Bad Request |
| 8 | Resolve twice | 400 Bad Request |
| 9 | Tied Quadratic proposal | Same workflow as Simple |

### Exit Criteria
✅ All 9 test cases pass

---

## Phase 9: Documentation & Cleanup

### Goals
- [ ] Update README with tie-breaking section
- [ ] Add inline code comments
- [ ] Clean up console logs

### README Section to Add
```markdown
## Tie-Breaking Policy

If a proposal ends with equal YES and NO votes, the Admin must resolve:
- **Reject (Status Quo)**: Proposal fails.
- **Chairperson's Vote**: Admin casts the deciding vote.

The resolution is recorded in the database (and optionally on-chain).
```

### Exit Criteria
✅ README updated  
✅ Code reviewed  
✅ No debug artifacts

---

## Summary of Files

| Phase | File | Action |
|-------|------|--------|
| 1 | `backend/prisma/schema.prisma` | MODIFY |
| 2 | `backend/src/services/tie-resolution.service.ts` | NEW |
| 3 | `backend/src/controllers/tie-resolution.controller.ts` | NEW |
| 3 | `backend/src/routes/index.ts` | MODIFY |
| 4 | `frontend/src/services/proposal.service.ts` | MODIFY |
| 5 | `frontend/src/components/TieResolutionModal.tsx` | NEW |
| 5 | `frontend/src/components/TieResolutionModal.css` | NEW |
| 6 | `frontend/src/pages/ProposalDetail.tsx` | MODIFY |
| 7 | `smart-contracts/contracts/Voting.sol` | MODIFY (Optional) |
| 9 | `README.md` | MODIFY |

---

## Definition of Done

- [ ] All phases completed in order
- [ ] All exit criteria met
- [ ] No regressions in existing functionality
- [ ] Professor-ready explanation prepared
