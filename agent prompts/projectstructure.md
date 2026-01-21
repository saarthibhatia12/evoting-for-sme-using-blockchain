# Agent Prompt – Step 1: Project Setup & Architecture Skeleton

## 1. Context: What We’re Building

We are building a **Blockchain-Based Secure Shareholder Voting System for SMEs** with:

- **Smart contracts**: Solidity on a local Ethereum network (Hardhat)
- **Backend**: Node.js + Express + MySQL/PostgreSQL
- **Frontend**: React (SPA) with MetaMask integration
- **Web3 layer**: ethers.js for contract interaction
- **Auth**: MetaMask + nonce-based wallet signature verification
- **Core logic**: weighted voting based on number of shares per shareholder

This step is ONLY about **creating a clean project skeleton and folder structure**, not full implementation.

---

## 2. Goal of This Step

Set up a **mono-repo/project root** that contains:

- A **smart-contracts** workspace (Hardhat + Solidity)
- A **backend** workspace (Node.js + Express + DB config)
- A **frontend** workspace (React + basic MetaMask placeholder)

Everything should **install and run without errors** (basic “hello-world”-level commands).

---

## 3. Tech Stack & Requirements

- Node.js (LTS)
- Package manager: npm or yarn (use one consistently, prefer npm)
- Smart contracts: Solidity + Hardhat
- Backend: Node.js, Express, TypeScript (optional but preferred), dotenv
- Frontend: React (Vite or CRA; prefer Vite), basic routing
- Web3: ethers.js (will be wired later)
- Git-ready repo (with `.gitignore`)

---

## 4. Tasks for You (Agent) – Step 1

### 4.1. Create Repository Structure

Create a root folder structure like:

```text
sme-voting-system/
  README.md
  smart-contracts/
  backend/
  frontend/
  .gitignore
  package.json (optional root, if using workspaces)
  ```

### 4.2. Initialize Smart Contracts Workspace (smart-contracts/)

Inside smart-contracts/:

Initialize a Hardhat project.

Configure:

hardhat.config.js (or .ts) with:

Local network config

Solidity version (e.g., 0.8.x)

Add a sample contract file (e.g., contracts/Sample.sol) with a trivial function (e.g., returns a string "Hello SME Voting").

Add a sample test under test/ to verify deployment.

Ensure scripts:

npx hardhat compile

npx hardhat test
run successfully.

### 4.3. Initialize Backend Workspace (backend/)

Inside backend/:

Initialize a Node.js project with:

package.json

Dependencies: express, cors, dotenv

Dev deps (optional): nodemon, typescript, ts-node, @types/* if using TS

Create a minimal server:

Entry file: src/index.js or src/index.ts

Expose a test endpoint: GET /health → returns { status: "ok" }

Add npm scripts:

"dev" → run with nodemon

"start" → run compiled JS (if TS used)

Ensure npm install and npm run dev work.

We will later:

Add DB connection

Add routes for shareholders, proposals, nonce auth

Integrate ethers.js

### 4.4. Initialize Frontend Workspace (frontend/)

Inside frontend/:

Create a React app (prefer Vite + React + JS/TS).

Set up:

A base layout with a simple navbar placeholder.

Two placeholder pages/components:

AdminDashboard (text: “Admin Dashboard Placeholder”)

ShareholderDashboard (text: “Shareholder Dashboard Placeholder`)

Add simple routing (if using React Router or basic conditional rendering).

Add a placeholder “Connect Wallet” button (no real logic yet, just a button).

Ensure:

npm install

npm run dev
work without errors.


### 4.5. Basic Documentation & Scripts

In the root README.md, document:

How to run:

smart-contracts (compile & test)

backend (dev)

frontend (dev)

Optional: If using npm workspaces, configure root package.json to manage the three subprojects.