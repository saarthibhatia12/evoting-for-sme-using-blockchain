# SME Voting System - Deployment Guide

> **Version:** 2.0 (with Quadratic Voting)  
> **Last Updated:** December 30, 2025  
> **Author:** Development Team

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Prerequisites](#prerequisites)
4. [Local Development Deployment](#local-development-deployment)
5. [Staging Deployment](#staging-deployment)
6. [Production Deployment](#production-deployment)
7. [Rollback Procedures](#rollback-procedures)
8. [Troubleshooting](#troubleshooting)
9. [Health Checks](#health-checks)

---

## Overview

The SME Voting System consists of four main layers:

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Database** | MySQL + Prisma ORM | Data persistence |
| **Smart Contracts** | Solidity + Hardhat | Blockchain voting logic |
| **Backend** | Node.js + Express + TypeScript | API server |
| **Frontend** | React + TypeScript + Vite | User interface |

### Deployed Contracts

| Contract | Purpose | Required |
|----------|---------|----------|
| `Voting.sol` | Simple voting (1 share = 1 vote) | ✅ Yes |
| `QuadraticVoting.sol` | Quadratic voting (cost = votes²) | ⚠️ Optional |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│                      http://localhost:5173                        │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend API (Express)                        │
│                      http://localhost:3001                        │
└─────────────────────────────────────────────────────────────────┘
            │                                    │
            ▼                                    ▼
┌─────────────────────┐            ┌─────────────────────────────┐
│   MySQL Database    │            │   Blockchain (Hardhat)      │
│   localhost:3306    │            │   http://127.0.0.1:8545     │
└─────────────────────┘            └─────────────────────────────┘
                                              │
                                   ┌──────────┴──────────┐
                                   ▼                     ▼
                            ┌───────────┐       ┌────────────────┐
                            │ Voting.sol│       │QuadraticVoting │
                            │ (Simple)  │       │    .sol        │
                            └───────────┘       └────────────────┘
```

---

## Prerequisites

### Required Software

| Software | Version | Check Command |
|----------|---------|---------------|
| Node.js | >= 18.x | `node --version` |
| npm | >= 9.x | `npm --version` |
| MySQL | >= 8.0 | `mysql --version` |
| Git | >= 2.x | `git --version` |

### Environment Files

Copy example files and configure:

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your values

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env if needed
```

---

## Local Development Deployment

### Quick Start (Automated)

```batch
# Windows - Double-click or run:
restart-project.bat
```

### Manual Start (Step-by-Step)

#### Step 1: Database Setup

```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE sme_voting;
exit;

# Apply migrations
cd backend
npm install
npx prisma migrate dev
npm run db:seed  # Optional: seed test data
```

#### Step 2: Start Blockchain

```bash
# Terminal 1 - Start Hardhat node
cd smart-contracts
npm install
npx hardhat node
# Keep this terminal running!
```

#### Step 3: Deploy Smart Contracts

```bash
# Terminal 2 - Deploy contracts
cd smart-contracts
npx hardhat run scripts/deploy.js --network localhost

# OUTPUT:
# ============================================================
#   SME Voting System - Smart Contract Deployment
# ============================================================
# 
# [1/2] Deploying Voting contract (Simple Voting)...
#   ✅ Voting contract deployed to: 0x5FbDB2315678...
# 
# [2/2] Deploying QuadraticVoting contract...
#   ✅ QuadraticVoting contract deployed to: 0xe7f1725E7734...
#
# 📋 Add these to your backend .env file:
# ----------------------------------------------------------
# CONTRACT_ADDRESS=0x5FbDB2315678...
# QUADRATIC_CONTRACT_ADDRESS=0xe7f1725E7734...
```

> ⚠️ **IMPORTANT:** Copy the contract addresses to `backend/.env`

#### Step 4: Start Backend

```bash
# Terminal 3 - Start backend
cd backend
npm run dev

# Should see: Server running on http://localhost:3001
```

#### Step 5: Start Frontend

```bash
# Terminal 4 - Start frontend
cd frontend
npm install
npm run dev

# Should see: Local: http://localhost:5173
```

### Verification Checklist

- [ ] Hardhat node running on port 8545
- [ ] Backend health check: `curl http://localhost:3001/api/health`
- [ ] Frontend accessible at http://localhost:5173
- [ ] Admin can log in
- [ ] Shareholders can view proposals

---

## Staging Deployment

### Environment Configuration

Create `backend/.env.staging`:

```bash
NODE_ENV=staging
PORT=3001

# Database - Use managed MySQL (AWS RDS, Cloud SQL, etc.)
DATABASE_URL="mysql://user:password@staging-db.example.com:3306/sme_voting_staging"

# Blockchain - Use testnet (Sepolia, Goerli)
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
CONTRACT_ADDRESS=0x...your-deployed-voting-address
QUADRATIC_CONTRACT_ADDRESS=0x...your-deployed-quadratic-address
CHAIN_ID=11155111  # Sepolia

# Use secure private key management!
ADMIN_PRIVATE_KEY=0x...  # Use AWS Secrets Manager or similar

# Strong JWT secret
JWT_SECRET=your-secure-staging-secret-minimum-32-chars
JWT_EXPIRES_IN=24h
```

### Deployment Steps

```bash
# 1. Deploy contracts to testnet
cd smart-contracts
npx hardhat run scripts/deploy.js --network sepolia

# 2. Update .env.staging with contract addresses

# 3. Build and deploy backend
cd backend
npm run build
# Deploy dist/ to your staging server

# 4. Build and deploy frontend
cd frontend
npm run build
# Deploy dist/ to CDN or static hosting
```

---

## Production Deployment

> ⚠️ **CRITICAL: Production deployments require additional security measures**

### Pre-Deployment Checklist

- [ ] All tests passing (106 tests)
- [ ] Security audit completed for smart contracts
- [ ] Database backups configured
- [ ] SSL/TLS certificates obtained
- [ ] Environment secrets secured (AWS Secrets Manager, HashiCorp Vault)
- [ ] Rate limiting configured
- [ ] Monitoring and alerting setup

### Production Environment

Create `backend/.env.production`:

```bash
NODE_ENV=production
PORT=3001

# Database - Production MySQL with connection pooling
DATABASE_URL="mysql://user:password@prod-db.example.com:3306/sme_voting?connection_limit=10"

# Blockchain - Mainnet or L2
BLOCKCHAIN_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
CONTRACT_ADDRESS=0x...production-voting-address
QUADRATIC_CONTRACT_ADDRESS=0x...production-quadratic-address
CHAIN_ID=1  # Ethereum Mainnet

# NEVER hardcode private keys in production!
# Use environment variables from secret manager
ADMIN_PRIVATE_KEY=${SECRET_ADMIN_PRIVATE_KEY}

# Strong JWT secret from secret manager
JWT_SECRET=${SECRET_JWT_SECRET}
JWT_EXPIRES_IN=12h
```

### Smart Contract Deployment to Mainnet

```bash
# 1. Verify contract source code
npx hardhat verify --network mainnet CONTRACT_ADDRESS

# 2. Deploy with verification
npx hardhat run scripts/deploy.js --network mainnet

# 3. Verify both contracts on Etherscan
npx hardhat verify --network mainnet VOTING_ADDRESS
npx hardhat verify --network mainnet QUADRATIC_ADDRESS
```

### Production Build Commands

```bash
# Backend
cd backend
npm ci --production
npm run build
NODE_ENV=production node dist/index.js

# Frontend
cd frontend
npm ci
npm run build
# Serve dist/ via Nginx or CDN
```

---

## Rollback Procedures

> 🛡️ **Safety First:** Always have a tested rollback plan before deployment

### 1. Database Rollback

```bash
# Revert last migration
cd backend
npx prisma migrate revert

# Or restore from backup
mysql -u root -p sme_voting < backup_YYYYMMDD.sql
```

### 2. Smart Contract Rollback

**Simple Voting (Voting.sol):**
```bash
# Deploy previous version of contract
cd smart-contracts
git checkout <previous-commit> -- contracts/Voting.sol
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost
# Update CONTRACT_ADDRESS in .env
```

**Quadratic Voting (QuadraticVoting.sol):**
```bash
# QuadraticVoting can be disabled without affecting simple voting
# Just remove QUADRATIC_CONTRACT_ADDRESS from .env
# Or deploy previous version:
git checkout <previous-commit> -- contracts/QuadraticVoting.sol
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost
```

> ⚠️ **Note:** Smart contracts are immutable once deployed. "Rollback" means deploying a new contract instance and updating addresses.

### 3. Backend Rollback

```bash
# Option A: Revert code and redeploy
git checkout <previous-commit>
npm run build
npm start

# Option B: Use container rollback (Docker/K8s)
kubectl rollout undo deployment/backend

# Option C: Blue-green deployment switch
# Switch traffic to previous version
```

### 4. Frontend Rollback

```bash
# Option A: Revert and rebuild
git checkout <previous-commit>
npm run build
# Deploy dist/

# Option B: CDN rollback
# Point CDN to previous version in storage

# Option C: Container rollback
kubectl rollout undo deployment/frontend
```

### Rollback Decision Matrix

| Issue | Affected Layer | Rollback Action |
|-------|---------------|-----------------|
| API breaking change | Backend | Revert backend code |
| Database schema issue | Database | Migrate revert + backend revert |
| Smart contract bug | Contracts | Deploy previous + update env |
| UI broken | Frontend | Revert frontend build |
| Security vulnerability | All | Full rollback to known-good state |

---

## Troubleshooting

### Common Issues

#### 1. "Contract not deployed" Error

```bash
# Check if Hardhat is running
curl http://127.0.0.1:8545

# Redeploy contracts
cd smart-contracts
npx hardhat run scripts/deploy.js --network localhost
```

#### 2. Database Connection Failed

```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1"

# Verify DATABASE_URL in .env
cat backend/.env | grep DATABASE_URL

# Reset database
cd backend
npm run fresh-start
```

#### 3. Frontend Can't Connect to Backend

```bash
# Check CORS configuration in backend
# Verify VITE_API_BASE_URL in frontend/.env
# Check backend is running
curl http://localhost:3001/api/health
```

#### 4. MetaMask Connection Issues

```
# Ensure MetaMask is connected to correct network:
# - Local: Chain ID 31337, RPC http://127.0.0.1:8545
# - Sepolia: Chain ID 11155111
# - Mainnet: Chain ID 1

# Reset MetaMask account if nonce issues occur:
# Settings > Advanced > Reset Account
```

### Log Locations

| Component | Log Location |
|-----------|-------------|
| Hardhat | Terminal output |
| Backend | Console + `backend/logs/` |
| Frontend | Browser DevTools Console |
| MySQL | `/var/log/mysql/error.log` |

---

## Health Checks

### API Health Endpoint

```bash
# Check overall health
curl http://localhost:3001/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-12-30T10:00:00Z",
  "services": {
    "database": "connected",
    "blockchain": "connected"
  }
}
```

### Automated Health Check Script

```bash
#!/bin/bash
# health-check.sh

echo "Checking services..."

# Backend
if curl -s http://localhost:3001/api/health | grep -q "healthy"; then
    echo "✅ Backend: OK"
else
    echo "❌ Backend: FAILED"
fi

# Blockchain
if curl -s -X POST http://127.0.0.1:8545 \
    -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    | grep -q "result"; then
    echo "✅ Blockchain: OK"
else
    echo "❌ Blockchain: FAILED"
fi

# Frontend
if curl -s http://localhost:5173 | grep -q "html"; then
    echo "✅ Frontend: OK"
else
    echo "❌ Frontend: FAILED"
fi
```

---

## Support

For issues or questions:

1. Check this guide's [Troubleshooting](#troubleshooting) section
2. Review [RESTART_GUIDE.md](./RESTART_GUIDE.md) for restart scenarios
3. Check test results: `cd smart-contracts && npx hardhat test`
4. Contact the development team

---

## Appendix: Environment Variables Reference

### Backend (.env)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 3001 | Server port |
| `NODE_ENV` | No | development | Environment |
| `DATABASE_URL` | Yes | - | MySQL connection string |
| `BLOCKCHAIN_RPC_URL` | Yes | http://127.0.0.1:8545 | RPC endpoint |
| `CONTRACT_ADDRESS` | Yes | - | Voting.sol address |
| `QUADRATIC_CONTRACT_ADDRESS` | No | - | QuadraticVoting.sol address |
| `CHAIN_ID` | No | 31337 | Blockchain network ID |
| `ADMIN_PRIVATE_KEY` | Yes | - | Admin wallet private key |
| `JWT_SECRET` | Yes | - | JWT signing secret |
| `JWT_EXPIRES_IN` | No | 24h | Token expiration |

### Frontend (.env)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | No | http://localhost:3001 | Backend API URL |
| `VITE_CHAIN_ID` | No | 31337 | Expected chain ID |
