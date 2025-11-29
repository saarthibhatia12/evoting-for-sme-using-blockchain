# SME Voting System

A **Blockchain-Based Secure Shareholder Voting System for SMEs** built with:

- **Smart Contracts**: Solidity on Ethereum (Hardhat)
- **Backend**: Node.js + Express + TypeScript + MySQL/PostgreSQL
- **Frontend**: React (Vite) with MetaMask integration
- **Web3**: ethers.js for contract interaction

## Project Structure

```
sme-voting-system/
├── smart-contracts/    # Solidity contracts + Hardhat
├── backend/            # Node.js + Express API
├── frontend/           # React + Vite SPA
├── .gitignore
├── package.json        # Root workspace config
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (LTS version)
- npm
- MetaMask browser extension (for frontend testing)

### Installation

1. Install all dependencies from the root:
   ```bash
   npm install
   ```

2. Or install each workspace separately:
   ```bash
   cd smart-contracts && npm install
   cd backend && npm install
   cd frontend && npm install
   ```

### Running the Projects

#### Smart Contracts
```bash
cd smart-contracts
npm run compile    # Compile contracts
npm run test       # Run tests
npm run node       # Start local Hardhat node
```

#### Backend
```bash
cd backend
npm run dev        # Start development server
```

#### Frontend
```bash
cd frontend
npm run dev        # Start Vite dev server
```

## Features (Planned)

- Weighted voting based on shareholder shares
- MetaMask wallet authentication
- Nonce-based signature verification
- Transparent voting records on blockchain
- Admin dashboard for managing proposals

## License

MIT
