# Step 3 - Backend API & Authentication Layer - COMPLETE ✅

## Project: Blockchain-Based Secure Shareholder Voting System for SMEs

**Completion Date:** November 30, 2025

---

## 📁 Backend File Structure

```
backend/
├── package.json
├── tsconfig.json
├── .env
├── prisma/
│   ├── schema.prisma
│   └── prisma.config.ts
└── src/
    ├── index.ts                          # Express server entry point
    ├── config/
    │   └── index.ts                      # Configuration management
    ├── contracts/
    │   └── VotingABI.ts                  # Smart contract ABI
    ├── controllers/
    │   ├── auth.controller.ts            # Authentication handlers
    │   ├── health.controller.ts          # Health check handlers
    │   ├── proposal.controller.ts        # Proposal handlers
    │   ├── shareholder.controller.ts     # Shareholder handlers
    │   └── voting.controller.ts          # Voting handlers
    ├── middleware/
    │   ├── auth.middleware.ts            # JWT authentication
    │   ├── error.middleware.ts           # Error handling
    │   ├── security.middleware.ts        # Security headers & rate limiting
    │   └── validation.middleware.ts      # Input validation
    ├── routes/
    │   ├── index.ts                      # Main router
    │   ├── auth.routes.ts                # Auth routes
    │   ├── proposal.routes.ts            # Proposal routes
    │   ├── results.routes.ts             # Results routes
    │   ├── shareholder.routes.ts         # Shareholder routes
    │   └── voting.routes.ts              # Voting routes
    ├── services/
    │   ├── auth.service.ts               # Authentication logic
    │   ├── blockchain.service.ts         # Blockchain interactions
    │   ├── database.service.ts           # Database connection
    │   ├── logger.service.ts             # Logging service
    │   ├── proposal.service.ts           # Proposal logic
    │   ├── shareholder.service.ts        # Shareholder logic
    │   └── voting.service.ts             # Voting logic
    └── utils/
        └── validation.ts                 # Validation utilities
```

---

## 🗄️ Database Schema (MySQL)

### Tables:

#### 1. shareholders
| Column | Type | Constraints |
|--------|------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT |
| wallet_address | VARCHAR(42) | UNIQUE, NOT NULL |
| name | VARCHAR(255) | NOT NULL |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| is_active | BOOLEAN | DEFAULT true |
| is_admin | BOOLEAN | DEFAULT false |
| created_at | DATETIME | DEFAULT NOW() |
| updated_at | DATETIME | ON UPDATE |

#### 2. shares
| Column | Type | Constraints |
|--------|------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT |
| shareholder_id | INT | UNIQUE, FOREIGN KEY → shareholders.id |
| shares | INT | DEFAULT 0 |
| created_at | DATETIME | DEFAULT NOW() |
| updated_at | DATETIME | ON UPDATE |

#### 3. proposals
| Column | Type | Constraints |
|--------|------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT |
| proposal_id | INT | UNIQUE (blockchain ID) |
| title | VARCHAR(500) | NOT NULL |
| description | TEXT | NULLABLE |
| start_time | DATETIME | NOT NULL |
| end_time | DATETIME | NOT NULL |
| is_active | BOOLEAN | DEFAULT true |
| created_at | DATETIME | DEFAULT NOW() |
| updated_at | DATETIME | ON UPDATE |

#### 4. auth_nonces
| Column | Type | Constraints |
|--------|------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT |
| wallet_address | VARCHAR(42) | UNIQUE |
| nonce | VARCHAR(255) | NOT NULL |
| expires_at | DATETIME | NOT NULL |
| created_at | DATETIME | DEFAULT NOW() |

#### 5. votes
| Column | Type | Constraints |
|--------|------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT |
| shareholder_id | INT | FOREIGN KEY → shareholders.id |
| proposal_id | INT | FOREIGN KEY → proposals.proposal_id |
| vote_choice | BOOLEAN | NOT NULL |
| tx_hash | VARCHAR(66) | NULLABLE |
| voted_at | DATETIME | DEFAULT NOW() |
| | | UNIQUE(shareholder_id, proposal_id) |

---

## 🔌 API Endpoints

### Health & Info

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ❌ | API info |
| GET | `/health` | ❌ | Health check |

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/nonce` | ❌ | Request nonce for wallet |
| POST | `/auth/verify` | ❌ | Verify signature & get JWT |
| GET | `/auth/me` | ✅ | Get current user info |

### Shareholders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/shareholders` | ✅ | List all shareholders |
| POST | `/shareholders/register` | 🔒 Admin | Register new shareholder |
| GET | `/shareholders/:walletAddress` | ✅ | Get shareholder by wallet |
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
| POST | `/vote` | ✅ Shareholder | Cast a vote |
| GET | `/vote/my-votes` | ✅ | Get user's votes |
| GET | `/vote/check/:proposalId` | ✅ | Check if voted |
| GET | `/vote/proposal/:proposalId` | 🔒 Admin | Get all votes for proposal |

### Results

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/results/:proposalId` | ✅ | Get voting results |

**Legend:** ❌ No auth | ✅ JWT required | 🔒 Admin only

---

## 📝 Sample API Requests & Responses

### 1. Health Check

**Request:**
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-30T12:50:20.924Z",
  "uptime": 35.69,
  "services": {
    "database": "connected",
    "blockchain": "connected"
  }
}
```

---

### 2. Request Authentication Nonce

**Request:**
```http
POST /auth/nonce
Content-Type: application/json

{
  "walletAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nonce": "a1b2c3d4e5f6...",
    "message": "Welcome to SME Voting System!\n\nPlease sign this message to authenticate.\n\nNonce: a1b2c3d4e5f6...\n\nThis request will not trigger a blockchain transaction or cost any gas fees."
  }
}
```

---

### 3. Verify Signature & Get JWT

**Request:**
```http
POST /auth/verify
Content-Type: application/json

{
  "walletAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "signature": "0x1234abcd..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "walletAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  }
}
```

---

### 4. Register Shareholder (Admin)

**Request:**
```http
POST /shareholders/register
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "walletAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "name": "John Doe",
  "email": "john@example.com",
  "shares": 500,
  "isAdmin": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shareholder": {
      "id": 2,
      "walletAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      "name": "John Doe",
      "email": "john@example.com",
      "isActive": true,
      "isAdmin": false,
      "shares": {
        "shares": 500
      }
    },
    "blockchainTx": "0xabc123..."
  },
  "message": "Shareholder registered successfully"
}
```

---

### 5. Get All Shareholders

**Request:**
```http
GET /shareholders
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shareholders": [
      {
        "id": 1,
        "walletAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "name": "Admin",
        "email": "admin@company.com",
        "isActive": true,
        "isAdmin": true,
        "shares": {
          "shares": 1000
        }
      }
    ],
    "count": 1
  }
}
```

---

### 6. Create Proposal (Admin)

**Request:**
```http
POST /proposals/create
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Approve Annual Budget 2026",
  "description": "Vote to approve the proposed budget for fiscal year 2026.",
  "startTime": "2025-12-01T00:00:00Z",
  "endTime": "2025-12-07T23:59:59Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "proposal": {
      "id": 1,
      "proposalId": 1,
      "title": "Approve Annual Budget 2026",
      "description": "Vote to approve the proposed budget for fiscal year 2026.",
      "startTime": "2025-12-01T00:00:00.000Z",
      "endTime": "2025-12-07T23:59:59.000Z",
      "isActive": true
    },
    "blockchainTx": "0xdef456..."
  },
  "message": "Proposal created successfully"
}
```

---

### 7. Get All Proposals

**Request:**
```http
GET /proposals
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "proposals": [
      {
        "id": 1,
        "proposalId": 1,
        "title": "Approve Annual Budget 2026",
        "description": "Vote to approve the proposed budget for fiscal year 2026.",
        "startTime": "2025-12-01T00:00:00.000Z",
        "endTime": "2025-12-07T23:59:59.000Z",
        "isActive": true,
        "status": "upcoming",
        "votingOpen": false
      }
    ],
    "count": 1
  }
}
```

---

### 8. Cast Vote

**Request:**
```http
POST /vote
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "proposalId": 1,
  "voteChoice": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "vote": {
      "id": 1,
      "shareholderId": 1,
      "proposalId": 1,
      "voteChoice": true,
      "txHash": null,
      "votedAt": "2025-12-02T10:30:00.000Z"
    }
  },
  "message": "Vote cast successfully: YES"
}
```

---

### 9. Get Voting Results

**Request:**
```http
GET /results/1
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "proposalId": 1,
    "title": "Approve Annual Budget 2026",
    "description": "Vote to approve the proposed budget for fiscal year 2026.",
    "yesVotes": "1500",
    "noVotes": "500",
    "totalVotes": "2000",
    "yesPercentage": 75,
    "noPercentage": 25,
    "votingOpen": false,
    "startTime": "2025-12-01T00:00:00.000Z",
    "endTime": "2025-12-07T23:59:59.000Z"
  }
}
```

---

### 10. Get My Votes

**Request:**
```http
GET /vote/my-votes
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "votes": [
      {
        "proposalId": 1,
        "proposalTitle": "Approve Annual Budget 2026",
        "voteChoice": true,
        "votedAt": "2025-12-02T10:30:00.000Z",
        "proposalStatus": "ended"
      }
    ],
    "count": 1
  }
}
```

---

## 🔒 Security Features Implemented

| Feature | Implementation |
|---------|---------------|
| **Wallet Validation** | ethers.js address validation on all endpoints |
| **Input Validation** | express-validator on all request bodies |
| **JWT Authentication** | Token-based auth with 24-hour expiry |
| **Role-Based Access** | Admin-only routes for sensitive operations |
| **Rate Limiting** | 100 requests per 15 minutes per IP |
| **Security Headers** | X-Frame-Options, XSS-Protection, CSP |
| **Duplicate Prevention** | Unique constraints on wallet & email |
| **Vote Security** | One vote per shareholder per proposal |
| **Nonce Expiry** | 15-minute expiry on auth nonces |
| **Error Handling** | Centralized error middleware |
| **Request Logging** | All requests logged with timing |
| **Blockchain Logging** | All transactions logged |

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js |
| Framework | Express.js |
| Language | TypeScript |
| Database | MySQL |
| ORM | Prisma |
| Blockchain | ethers.js v6 |
| Authentication | JWT + MetaMask Nonce Signing |
| Validation | express-validator |

---

## 🚀 How to Run

### 1. Start Hardhat Node
```bash
cd smart-contracts
npx hardhat node
```

### 2. Deploy Contract (in new terminal)
```bash
cd smart-contracts
npx hardhat run scripts/deploy.js --network localhost
```

### 3. Start Backend (in new terminal)
```bash
cd backend
npm run dev
```

### 4. Test Health Endpoint
```
http://localhost:3001/health
```

---

## ✅ Completion Criteria Met

| Criteria | Status |
|----------|--------|
| Server runs successfully | ✅ |
| DB connects properly | ✅ |
| Authentication works | ✅ |
| Smart contract interaction works | ✅ |
| All APIs return expected output | ✅ |

---

## 📋 Environment Variables (.env)

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL="mysql://root:yourpassword@localhost:3306/sme_voting"

# Blockchain
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
ADMIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CHAIN_ID=31337

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
```

---

**Step 3 Backend Development - COMPLETE** 🎉

Ready for **Step 4: Frontend Development**
