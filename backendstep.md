# STEP 3 -- Backend API & Authentication Layer (Agent Prompt) {#step-3-backend-api-authentication-layer-agent-prompt}

SYSTEM CONTEXT  
  
You are building the BACKEND for a project titled:  
"Blockchain-Based Secure Shareholder Voting System for SMEs"  
  
This backend will:  
- Act as the bridge between the React frontend and the Solidity smart
contracts  
- Handle shareholder records, proposals, and authentication  
- Implement MetaMask-based nonce signature authentication  
- Store off-chain metadata securely in a relational database  
  
This step ONLY focuses on backend development.  
Do NOT implement frontend UI or smart contracts here.  
  
\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--  
  
TECH STACK CONSTRAINTS  
  
- Runtime: Node.js (LTS)  
- Framework: Express.js  
- Database: MySQL or PostgreSQL  
- ORM (optional): Prisma / Sequelize / Knex  
- Blockchain Connector: ethers.js  
- Auth: Nonce-based wallet signature authentication  
- Environment variables: dotenv  
  
\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--  
  
TASK 3.1 -- Backend Project Setup  
  
1. Initialize Node.js backend inside "backend/" folder.  
2. Install dependencies:  
- express  
- cors  
- dotenv  
- ethers  
3. Add dev tools:  
- nodemon  
4. Create project structure:  
backend/  
src/  
index.js  
routes/  
controllers/  
services/  
config/  
  
5. Create a basic Express server with:  
- CORS enabled  
- JSON body parsing  
- Health check route: GET /health → { status: \"ok\" }  
  
\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--  
  
TASK 3.2 -- Database Configuration  
  
1. Configure MySQL/PostgreSQL connection.  
2. Create tables for:  
- shareholders (id, wallet_address, name, email)  
- shares (shareholder_id, shares)  
- proposals (proposal_id, title, start_time, end_time)  
- auth_nonces (wallet_address, nonce)  
  
3. Ensure foreign key relationships.  
4. Load DB credentials from .env file.  
  
\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--  
  
TASK 3.3 -- Blockchain Integration using ethers.js  
  
1. Connect backend to:  
- Local Hardhat blockchain  
2. Load:  
- Contract ABI  
- Contract Address  
3. Initialize ethers Provider & Signer.  
4. Create service functions to:  
- Call createProposal()  
- Call addShareholder()  
- Call vote()  
- Call getProposalResult()  
  
\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--  
  
TASK 3.4 -- Authentication (MetaMask Nonce System)  
  
1. Create endpoint: POST /auth/nonce  
- Input: wallet address  
- Output: random nonce  
- Save nonce in database  
  
2. Create endpoint: POST /auth/verify  
- Input: wallet address + signature  
- Recover signer address using ethers.js  
- Match recovered address with provided wallet  
- If valid → authenticated  
  
\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--  
  
TASK 3.5 -- Core API Endpoints  
  
Shareholder APIs:  
- POST /shareholders/register  
- GET /shareholders  
  
Proposal APIs:  
- POST /proposals/create  
- GET /proposals  
- GET /proposals/:id  
  
Voting APIs:  
- POST /vote  
- GET /results/:proposalId  
  
\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--  
  
TASK 3.6 -- Security & Validation  
  
- Validate wallet addresses  
- Secure sensitive data using hashing  
- Prevent duplicate registrations  
- Prevent unauthorized voting  
- Log all blockchain interactions  
- Error handling for all failed requests  
  
\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--  
  
FINAL OUTPUT REQUIRED  
  
At the end, output:  
- All backend files  
- DB schema  
- All implemented API routes  
- Sample API request & response data  
  
\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--  
  
COMPLETION CRITERIA  
  
- Server runs successfully  
- DB connects properly  
- Authentication works  
- Smart contract interaction works  
- All APIs return expected output  
  
END OF STEP 3 PROMPT
