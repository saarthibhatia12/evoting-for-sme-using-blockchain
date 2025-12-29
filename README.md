# SME Voting System

A **Blockchain-Based Secure Shareholder Voting System for SMEs** that enables transparent, tamper-proof shareholder voting using blockchain technology.

![Status](https://img.shields.io/badge/Status-Fully%20Functional-green)
![Smart%20Contracts](https://img.shields.io/badge/Smart%20Contracts-Complete-green)
![Backend](https://img.shields.io/badge/Backend-Complete-green)
![Frontend](https://img.shields.io/badge/Frontend-Complete-green)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Smart Contracts** | Solidity 0.8.20, Hardhat |
| **Backend** | Node.js, Express.js, TypeScript |
| **Database** | MySQL with Prisma ORM |
| **Blockchain Integration** | ethers.js v6 |
| **Authentication** | MetaMask + JWT (Nonce-based signature) |
| **Frontend** | React 18 + Vite + TypeScript |
| **Routing** | React Router v6 |
| **HTTP Client** | Axios |

---

## ✨ Key Features

### 🔐 Security & Authentication
- **MetaMask Wallet Integration** - Secure wallet-based authentication
- **Nonce-based Signature Verification** - Prevents replay attacks
- **JWT Session Management** - Secure token-based sessions
- **Role-Based Access Control** - Admin and Shareholder roles
- **Input Validation & Sanitization** - XSS and injection protection
- **Rate Limiting** - Protection against brute force attacks

### 🗳️ Voting System
- **Weighted Voting** - Votes weighted by share ownership
- **Time-based Proposals** - Voting windows with start/end dates
- **Frontend-Signed Transactions** - Users sign votes directly with MetaMask
- **One Vote Per Shareholder** - Double-vote prevention (on-chain + database)
- **Real-time Results** - Live vote tallying and percentages
- **Transparent Audit Trail** - All votes recorded on blockchain

### 👥 Shareholder Management
- **Automatic Blockchain Sync** - Shareholders auto-synced on backend startup
- **Wallet Auto-Funding** - Shareholders receive 10 ETH for gas fees
- **Share Allocation** - Flexible share distribution per shareholder
- **Account Reactivation** - Deactivated accounts can be reactivated

### 📊 Admin Features
- **Proposal Management** - Create, view, and manage voting proposals
- **Shareholder Registration** - Add shareholders with wallet addresses
- **Share Management** - Update shareholder share counts
- **Voting Analytics** - View detailed voting results and statistics
- **Dashboard Overview** - Comprehensive statistics and quick actions

### 🎨 User Experience
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Toast Notifications** - Real-time feedback for all actions
- **Loading States** - Clear indicators during async operations
- **Protected Routes** - Role-based page access
- **MetaMask Integration** - Seamless wallet connection and transaction signing

---

## 📁 Project Structure

```
sme-voting-system/
├── smart-contracts/          # Solidity contracts + Hardhat
│   ├── contracts/
│   │   ├── Voting.sol        # Main voting contract
│   │   └── ShareholderVoting.sol
│   ├── scripts/
│   │   ├── deploy.js         # Contract deployment
│   │   ├── check-admin.js    # Admin verification script
│   │   └── fund-wallets.js   # Wallet funding utility
│   ├── test/                 # Contract tests
│   └── hardhat.config.js
│
├── backend/                  # Node.js + Express API
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   ├── seed.ts           # Database seeding
│   │   ├── sync-to-blockchain.ts  # Manual sync utility
│   │   └── verify-blockchain.ts   # Verification utility
│   └── src/
│       ├── index.ts          # Express server entry
│       ├── config/           # Configuration management
│       ├── contracts/        # Smart contract ABIs
│       ├── controllers/      # Request handlers
│       ├── middleware/       # Auth, validation, security
│       ├── routes/           # API route definitions
│       ├── services/         # Business logic
│       │   ├── blockchain.service.ts    # Smart contract interactions
│       │   ├── startup.service.ts       # Auto-sync on startup
│       │   └── ...
│       └── utils/            # Utility functions
│
├── frontend/                 # React + Vite SPA
│   └── src/
│       ├── components/       # Reusable components
│       │   ├── ui/          # UI primitives (Toast, Loading, Forms)
│       │   ├── Navbar.tsx
│       │   ├── ProposalCard.tsx
│       │   ├── VoteModal.tsx
│       │   └── ...
│       ├── pages/            # Page components
│       │   ├── Home.tsx
│       │   ├── Login.tsx
│       │   ├── AdminDashboard.tsx
│       │   ├── ShareholderDashboard.tsx
│       │   └── ProposalDetail.tsx
│       ├── context/          # React Context providers
│       │   ├── WalletContext.tsx
│       │   └── AuthContext.tsx
│       ├── services/         # API service layer
│       ├── styles/           # CSS styling
│       └── contracts/        # Contract ABIs (frontend)
│
└── README.md
```

---

## ✅ Development Progress

### Step 1: Project Setup ✅
- [x] Monorepo structure with npm workspaces
- [x] Smart contracts, backend, frontend folders initialized
- [x] Development environment configured

### Step 2: Smart Contracts ✅
- [x] `Voting.sol` - Weighted voting with shareholder management
- [x] Proposal creation with time-based voting
- [x] Vote casting with share-based weight
- [x] One vote per shareholder enforcement
- [x] Comprehensive test suite
- [x] Deployment scripts

### Step 3: Backend API ✅
- [x] Express.js server with TypeScript
- [x] MySQL database with Prisma ORM
- [x] Blockchain integration via ethers.js
- [x] MetaMask nonce-signature authentication
- [x] JWT-based session management
- [x] RESTful API endpoints (20+ routes)
- [x] Input validation with express-validator
- [x] Security middleware (rate limiting, headers)
- [x] Centralized error handling
- [x] Request logging
- [x] **Auto-sync shareholders to blockchain on startup**
- [x] Transaction queue for nonce management

### Step 4: Frontend ✅
- [x] React 18 + Vite + TypeScript setup
- [x] MetaMask wallet connection
- [x] Wallet context for state management
- [x] Authentication context (JWT)
- [x] Shareholder dashboard with voting interface
- [x] Admin dashboard with proposal management
- [x] Shareholder management interface
- [x] Voting modal with MetaMask integration
- [x] Real-time vote results display
- [x] Toast notification system
- [x] Loading states and error handling
- [x] Protected routes with role checking
- [x] Responsive mobile design

---

## 🗄️ Database Schema

| Table | Description | Key Fields |
|-------|-------------|------------|
| `shareholders` | Shareholder records | wallet_address, name, email, is_admin, is_active |
| `shares` | Share ownership | shareholder_id, shares |
| `proposals` | Voting proposals | proposal_id, title, description, start_time, end_time |
| `votes` | Vote records | shareholder_id, proposal_id, vote_choice, tx_hash |
| `auth_nonces` | Authentication nonces | wallet_address, nonce, expires_at |

**Relationships:**
- `shareholders` → `shares` (1:1)
- `shareholders` → `votes` (1:many)
- `proposals` → `votes` (1:many)

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/nonce` | ❌ | Request authentication nonce |
| POST | `/auth/verify` | ❌ | Verify signature & get JWT |
| GET | `/auth/me` | ✅ | Get current user info |

### Shareholders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/shareholders` | ✅ | List all shareholders |
| POST | `/shareholders/register` | 🔒 Admin | Register new shareholder |
| GET | `/shareholders/:walletAddress` | ✅ | Get shareholder details |
| PUT | `/shareholders/:walletAddress/shares` | 🔒 Admin | Update shares |
| DELETE | `/shareholders/:walletAddress` | 🔒 Admin | Deactivate shareholder |
| GET | `/shareholders/stats/total-shares` | ✅ | Get total shares |

### Proposals
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/proposals` | ✅ | List all proposals |
| POST | `/proposals/create` | 🔒 Admin | Create new proposal |
| GET | `/proposals/:proposalId` | ✅ | Get proposal details |
| DELETE | `/proposals/:proposalId` | 🔒 Admin | Deactivate proposal |

### Voting
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/vote` | ✅ | Cast a vote |
| GET | `/vote/my-votes` | ✅ | Get user's votes |
| GET | `/vote/check/:proposalId` | ✅ | Check if voted |
| GET | `/vote/proposal/:proposalId` | 🔒 Admin | Get all votes for proposal |

### Results
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/results/:proposalId` | ✅ | Get voting results |

**Legend:** ❌ No auth | ✅ JWT required | 🔒 Admin only

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+ LTS)
- **npm** (v8+)
- **MySQL Server** (v8.0+)
- **MetaMask** browser extension
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/saarthibhatia12/evoting-for-sme-using-blockchain.git
cd evoting-for-sme-using-blockchain/sme-voting-system

# Install all dependencies
npm install
```

### Environment Setup

**1. Create MySQL Database:**
```sql
CREATE DATABASE sme_voting;
```

**2. Create `backend/.env`:**
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL="mysql://root:yourpassword@localhost:3306/sme_voting"

# Blockchain (Hardhat Local Network)
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
ADMIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CHAIN_ID=31337

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Optional: Admin Wallet Address (defaults to Hardhat Account #0)
ADMIN_WALLET_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

**3. Setup Database:**
```bash
cd backend
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run db:seed        # Seed admin user
```

**4. Create `frontend/.env`:**
```env
VITE_API_URL=http://localhost:3001/api
VITE_CHAIN_ID=31337
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Running the Project

**🚨 IMPORTANT: Run in this exact order!**

#### Terminal 1: Start Hardhat Blockchain Node
```bash
cd sme-voting-system/smart-contracts
npx hardhat node
```
*(Keep this running - this is your local Ethereum network)*

#### Terminal 2: Deploy Smart Contract
```bash
cd sme-voting-system/smart-contracts
npx hardhat run scripts/deploy.js --network localhost
```
*(Copy the `CONTRACT_ADDRESS` to your `backend/.env` and `frontend/.env`)*

#### Terminal 3: Start Backend Server
```bash
cd sme-voting-system/backend
npm run dev
```
*(Auto-syncs shareholders to blockchain on startup)*

#### Terminal 4: Start Frontend
```bash
cd sme-voting-system/frontend
npm run dev
```
*(Access at http://localhost:5173)*

---

## 🎯 Usage Guide

### For Administrators

1. **Login:**
   - Connect MetaMask wallet
   - Sign in with your admin wallet (default: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`)
   - You'll be redirected to Admin Dashboard

2. **Add Shareholders:**
   - Go to "Shareholders" tab
   - Click "Add Shareholder"
   - Enter wallet address, name, email, and share count
   - Shareholder is automatically added to blockchain and funded with 10 ETH

3. **Create Proposal:**
   - Go to "Proposals" tab
   - Click "Create Proposal"
   - Enter title, description, start time, and end time
   - Proposal is created on blockchain

4. **View Results:**
   - Go to "Results" tab
   - Select a proposal to view detailed voting results

### For Shareholders

1. **Login:**
   - Connect MetaMask wallet
   - Sign in with your registered wallet
   - You'll be redirected to Shareholder Dashboard

2. **View Proposals:**
   - See all active proposals on your dashboard
   - View proposal details including voting period

3. **Cast Vote:**
   - Click "Vote" on an active proposal
   - Choose YES or NO
   - Confirm transaction in MetaMask
   - Vote is recorded on blockchain and database

4. **View Your Votes:**
   - Go to "My Votes" tab
   - See all proposals you've voted on

---

## 🔄 Automatic Features

### Auto-Sync on Startup

The backend **automatically syncs all shareholders** from database to blockchain when it starts:

- ✅ Checks all active shareholders
- ✅ Adds missing shareholders to smart contract
- ✅ Funds wallets with 10 ETH (if balance < 1 ETH)
- ✅ Updates share counts if changed

**You no longer need to manually sync!** Just deploy the contract and start the backend.

### Utility Scripts

**Verify Blockchain Sync:**
```bash
cd backend
npm run db:verify-blockchain
```
*(Shows database vs blockchain comparison)*

**Manual Sync (if needed):**
```bash
cd backend
npm run db:sync-blockchain
```
*(Manually sync shareholders to blockchain)*

**Check Admin Configuration:**
```bash
cd smart-contracts
npx hardhat run scripts/check-admin.js --network localhost
```
*(Verifies admin wallet matches contract deployer)*

---

## 🔐 Security Features

- ✅ **Wallet Address Validation** - All addresses validated via ethers.js
- ✅ **Input Sanitization** - XSS and injection protection
- ✅ **JWT Authentication** - Secure token-based sessions (24h expiry)
- ✅ **Role-Based Access Control** - Admin vs Shareholder permissions
- ✅ **Rate Limiting** - 1000 req/min (dev), 100 req/15min (prod)
- ✅ **Security Headers** - XSS-Protection, CSP, X-Frame-Options
- ✅ **Nonce-based Authentication** - Prevents replay attacks
- ✅ **One Vote Enforcement** - Both on-chain and database level
- ✅ **Transaction Queue** - Prevents nonce conflicts
- ✅ **Request Logging** - All API requests logged

---

## 📊 Smart Contract Features

- **Weighted Voting** - Votes weighted by share ownership (1 share = 1 vote weight)
- **Time-based Proposals** - Voting windows with start/end timestamps
- **Shareholder Management** - Admin can add shareholders with shares
- **Double-Vote Prevention** - Mapping tracks if shareholder already voted
- **Transparent Results** - On-chain vote tallying (yesVotes, noVotes)
- **Event Logging** - All actions emit events (ShareholderAdded, ProposalCreated, VoteCast)
- **Admin-only Functions** - Only contract deployer can manage shareholders/proposals

---

## 🗳️ Voting Flow (Frontend-Signed)

This project uses **Option B: Frontend-Signed Voting** for maximum security:

1. User clicks "Vote YES/NO" in frontend
2. Frontend calls smart contract directly via MetaMask
3. User confirms transaction in MetaMask popup
4. Transaction is mined on blockchain
5. Frontend receives transaction hash
6. Frontend calls backend API to update database
7. Backend verifies vote exists on blockchain
8. Database updated with vote record

**Benefits:**
- ✅ Users control their own votes (trustless)
- ✅ No backend impersonation possible
- ✅ Fully auditable on blockchain
- ✅ Production-ready for any network

---

## 🧪 Testing

### Smart Contract Tests
```bash
cd smart-contracts
npx hardhat test
```

### Backend API Tests
```bash
# Health check
curl http://localhost:3001/health

# Request nonce
curl -X POST http://localhost:3001/api/auth/nonce \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"}'
```

### Database Management
```bash
cd backend

# Open Prisma Studio (GUI for database)
npm run db:studio

# Reset database (WARNING: deletes all data)
npm run db:migrate reset
```

---

## 👥 Default Accounts

### Admin Account (Hardhat Default)
| Field | Value |
|-------|-------|
| Wallet | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` |
| Private Key | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| Name | Admin User |
| Email | admin@example.com |
| Shares | 10,000 |
| ETH Balance | 10,000 ETH (Hardhat default) |

### Additional Test Accounts (Hardhat)
- Account #1: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- Account #2: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- Account #3: `0x90F79bf6EB2c4f870365E785982E1f101E93b906`
- ... (20 accounts total, each with 10,000 ETH)

---

## 🛠️ Troubleshooting

### "Failed to create proposal"
- **Solution:** Make sure Hardhat node is running and contract is deployed
- Run: `npx hardhat run scripts/deploy.js --network localhost`

### "Only shareholders can vote"
- **Solution:** Run sync script: `npm run db:sync-blockchain`
- Or restart backend (auto-sync runs on startup)

### "Nonce too low" errors
- **Solution:** This is fixed! Transaction queue handles nonces automatically
- If issues persist, restart Hardhat node

### "MetaMask RPC Error"
- **Solution:** Check MetaMask is connected to Hardhat network (Chain ID: 31337)
- Add network: Localhost 8545, Chain ID: 31337

### Backend won't start
- **Check:** MySQL is running
- **Check:** Database exists: `sme_voting`
- **Check:** `.env` file has correct DATABASE_URL
- **Check:** Run migrations: `npm run db:migrate`

### Frontend can't connect to backend
- **Check:** Backend is running on port 3001
- **Check:** `frontend/.env` has `VITE_API_URL=http://localhost:3001/api`
- **Check:** CORS is enabled in backend (should be automatic)

---

## 📚 Additional Documentation

- **[UI Modernization Prompt](UI_MODERNIZATION_PROMPT.md)** - Guide for modernizing the UI
- **[Backend Completion Summary](STEP3_BACKEND_COMPLETE.md)** - Detailed backend documentation
- **[Step 4 Summary](step4-summary.md)** - Frontend implementation details
- **[Option B Implementation](sme-voting-system/OPTION_B_IMPLEMENTATION.md)** - Voting flow explanation
- **[Shareholder Reactivation Fix](sme-voting-system/FIX_SHAREHOLDER_REACTIVATION.md)** - Reactivation feature docs

---

## 🎯 Project Status

| Component | Status | Notes |
|-----------|--------|-------|
| Smart Contracts | ✅ Complete | Fully tested and deployed |
| Backend API | ✅ Complete | Auto-sync, transaction queue |
| Frontend UI | ✅ Complete | All features functional |
| Documentation | ✅ Complete | Comprehensive guides |
| Testing | ✅ Complete | Contract tests passing |

**Current Status: Production-Ready for Local Development**

---

## 🚧 Future Enhancements

Potential improvements for future versions:

- [ ] Deploy to testnet/mainnet
- [ ] Gas optimization for smart contracts
- [ ] Vote delegation features
- [ ] Multi-chain support
- [ ] Email notifications
- [ ] Advanced analytics dashboard
- [ ] Mobile app version
- [ ] Vote privacy (zero-knowledge proofs)

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👨‍💻 Development Notes

### Important Workflows

**When Starting Fresh:**
1. Start Hardhat node
2. Deploy contract (get new address)
3. Update `.env` files with contract address
4. Start backend (auto-syncs shareholders)
5. Start frontend

**When Adding New Shareholder:**
- Admin adds via dashboard → Automatically synced to blockchain
- No manual steps needed!

**When Hardhat Node Restarts:**
- Blockchain resets (expected behavior)
- Redeploy contract
- Backend auto-syncs on startup
- Shareholders can vote immediately

---

**Built with ❤️ for transparent shareholder governance**

*Version: 1.0.0 | Last Updated: 2025*
