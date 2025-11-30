# SME Voting System

A **Blockchain-Based Secure Shareholder Voting System for SMEs** that enables transparent, tamper-proof shareholder voting using blockchain technology.

![Status](https://img.shields.io/badge/Status-In%20Development-yellow)
![Smart%20Contracts](https://img.shields.io/badge/Smart%20Contracts-Complete-green)
![Backend](https://img.shields.io/badge/Backend-Complete-green)
![Frontend](https://img.shields.io/badge/Frontend-Pending-orange)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Smart Contracts** | Solidity, Hardhat, Ethereum |
| **Backend** | Node.js, Express.js, TypeScript |
| **Database** | MySQL with Prisma ORM |
| **Blockchain Integration** | ethers.js v6 |
| **Authentication** | MetaMask + JWT |
| **Frontend** | React + Vite (In Progress) |

---

## 📁 Project Structure

```
sme-voting-system/
├── smart-contracts/          # Solidity contracts + Hardhat
│   ├── contracts/
│   │   ├── Voting.sol        # Main voting contract
│   │   └── ShareholderVoting.sol
│   ├── scripts/
│   │   └── deploy.js         # Deployment script
│   ├── test/                 # Contract tests
│   └── hardhat.config.js
│
├── backend/                  # Node.js + Express API
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   └── src/
│       ├── index.ts          # Express server
│       ├── config/           # Configuration
│       ├── controllers/      # Request handlers
│       ├── middleware/       # Auth, validation, security
│       ├── routes/           # API routes
│       ├── services/         # Business logic
│       └── utils/            # Utilities
│
├── frontend/                 # React + Vite SPA (In Progress)
│   └── src/
│       ├── components/
│       └── pages/
│
└── README.md
```

---

## ✅ Development Progress

### Step 1: Project Setup ✅
- [x] Monorepo structure with npm workspaces
- [x] Smart contracts, backend, frontend folders initialized

### Step 2: Smart Contracts ✅
- [x] `Voting.sol` - Weighted voting with shareholder management
- [x] Proposal creation with time-based voting
- [x] Vote casting with share-based weight
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

### Step 4: Frontend 🚧
- [ ] React components
- [ ] MetaMask wallet connection
- [ ] Shareholder dashboard
- [ ] Admin dashboard
- [ ] Voting interface

---

## 🗄️ Database Schema

| Table | Description |
|-------|-------------|
| `shareholders` | Wallet addresses, names, emails, admin status |
| `shares` | Share ownership records |
| `proposals` | Voting proposals with time ranges |
| `votes` | Vote records with blockchain tx hashes |
| `auth_nonces` | Nonces for MetaMask authentication |

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/nonce` | Request auth nonce |
| POST | `/auth/verify` | Verify signature & get JWT |
| GET | `/auth/me` | Get current user |

### Shareholders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/shareholders` | List all shareholders |
| POST | `/shareholders/register` | Register shareholder (Admin) |
| GET | `/shareholders/:walletAddress` | Get shareholder details |
| PUT | `/shareholders/:walletAddress/shares` | Update shares (Admin) |
| DELETE | `/shareholders/:walletAddress` | Deactivate (Admin) |

### Proposals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/proposals` | List all proposals |
| POST | `/proposals/create` | Create proposal (Admin) |
| GET | `/proposals/:proposalId` | Get proposal details |
| DELETE | `/proposals/:proposalId` | Deactivate (Admin) |

### Voting
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/vote` | Cast a vote |
| GET | `/vote/my-votes` | Get user's votes |
| GET | `/vote/check/:proposalId` | Check if voted |
| GET | `/results/:proposalId` | Get voting results |

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ LTS)
- npm
- MySQL Server
- MetaMask browser extension

### Installation

```bash
# Clone the repository
git clone https://github.com/saarthibhatia12/evoting-for-sme-using-blockchain.git
cd evoting-for-sme-using-blockchain/sme-voting-system

# Install all dependencies
npm install
```

### Environment Setup

Create `backend/.env`:
```env
PORT=3001
NODE_ENV=development
DATABASE_URL="mysql://root:yourpassword@localhost:3306/sme_voting"
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
ADMIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CHAIN_ID=31337
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
```

### Running the Project

#### Terminal 1: Start Hardhat Node
```bash
cd smart-contracts
npx hardhat node
```

#### Terminal 2: Deploy Smart Contract
```bash
cd smart-contracts
npx hardhat run scripts/deploy.js --network localhost
```

#### Terminal 3: Start Backend Server
```bash
cd backend
npm run dev
```

#### Terminal 4: Start Frontend (when ready)
```bash
cd frontend
npm run dev
```

### Verify Installation
```bash
# Test health endpoint
curl http://localhost:3001/health

# Expected response:
# {"status":"ok","services":{"database":"connected","blockchain":"connected"}}
```

---

## 🔐 Security Features

- ✅ Wallet address validation
- ✅ Input sanitization & validation
- ✅ JWT authentication with expiry
- ✅ Role-based access control (Admin/Shareholder)
- ✅ Rate limiting (100 req/15min)
- ✅ Security headers (XSS, CSP, X-Frame-Options)
- ✅ Nonce-based replay attack prevention
- ✅ One vote per shareholder per proposal

---

## 📊 Smart Contract Features

- **Weighted Voting**: Votes are weighted by share ownership
- **Time-based Proposals**: Voting windows with start/end times
- **Shareholder Management**: Add/remove shareholders with shares
- **Transparent Results**: On-chain vote tallying
- **Event Logging**: All actions emit events for tracking

---

## 🧪 Testing

### Smart Contract Tests
```bash
cd smart-contracts
npx hardhat test
```

### Backend API Tests
```bash
# Test authentication
curl -X POST http://localhost:3001/auth/nonce \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"}'
```

---

## 👥 Default Admin Account

| Field | Value |
|-------|-------|
| Wallet | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` |
| Name | Admin |
| Email | admin@company.com |
| Shares | 1000 |

*(This is Hardhat's default Account #0)*

---

## 📝 License

MIT

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**Built with ❤️ for transparent shareholder governance**
