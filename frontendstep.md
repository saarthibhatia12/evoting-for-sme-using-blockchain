# STEP 4 -- Frontend Development (React + MetaMask + Backend Integration) {#step-4-frontend-development-react-metamask-backend-integration}

SYSTEM CONTEXT  
  
You are building the FRONTEND for the project:  
  
"Blockchain-Based Secure Shareholder Voting System for SMEs"  
  
This frontend will:  
- Provide user interfaces for Admin and Shareholders  
- Connect to MetaMask for wallet authentication  
- Communicate with backend APIs for authentication and data  
- Display blockchain-backed proposal and voting information  
  
This step ONLY focuses on frontend development.  
Do NOT modify backend or smart contracts in this step.  
  
\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--  
  
TECH STACK CONSTRAINTS  
  
- Framework: React (Vite + React preferred)  
- Language: JavaScript or TypeScript  
- Styling: Tailwind CSS / CSS Modules / Styled Components  
- API Communication: Axios / Fetch API  
- Wallet Integration: MetaMask + ethers.js  
- Auth Strategy: JWT stored in memory/localStorage  
  
\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--  
  
TASK 4.1 -- Frontend Project Setup  
  
1. Initialize React frontend using Vite.  
2. Install dependencies:  
- axios  
- ethers  
- react-router-dom  
3. Setup project structure:  
frontend/  
src/  
pages/  
components/  
services/  
context/  
styles/  
  
4. Create basic routing:  
- /login  
- /admin  
- /shareholder  
- /proposals/:id  
  
\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--  
  
TASK 4.2 -- MetaMask Wallet Integration  
  
1. Implement "Connect Wallet" button.  
2. Detect MetaMask availability.  
3. Fetch user wallet address.  
4. Store wallet address in global state.  
5. Auto reconnect on refresh if MetaMask already connected.  
  
\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--  
  
TASK 4.3 -- Authentication Integration (Nonce + JWT)  
  
1. Call backend:  
- POST /auth/nonce  
- POST /auth/verify  
2. Store returned JWT token.  
3. Protect routes using JWT validation.  
4. Implement logout functionality.  
  
\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--  
  
TASK 4.4 -- Shareholder Dashboard  
  
1. Display:  
- Wallet address  
- Share count (from backend)  
2. Fetch active proposals.  
3. Cast vote (Yes/No) using backend voting API.  
4. Display vote confirmation and transaction hash.  
5. Show whether voting is open or closed.  
  
\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--  
  
TASK 4.5 -- Admin Dashboard  
  
1. Create new proposals.  
2. Assign shares to shareholders.  
3. View all proposals.  
4. View vote results.  
5. Monitor live voting status.  
  
\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--  
  
TASK 4.6 -- API Service Layer  
  
1. Create a centralized API handler using Axios.  
2. Attach JWT token to all secured requests.  
3. Implement separate service files:  
- authService.js  
- proposalService.js  
- votingService.js  
- shareholderService.js  
  
\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--  
  
TASK 4.7 -- UI & UX Enhancements  
  
- Form validation  
- Loading spinners  
- Success & error messages  
- Role-based navigation menu  
- Mobile responsive design  
  
\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--  
  
FINAL OUTPUT REQUIRED  
  
At the end, output:  
- Complete frontend source code  
- Working Admin Dashboard  
- Working Shareholder Dashboard  
- MetaMask wallet connection working  
- Backend API integrated  
  
\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--  
  
COMPLETION CRITERIA  
  
- User can connect wallet  
- User can authenticate via backend  
- Admin can manage proposals and shareholders  
- Shareholders can cast votes  
- Results display correctly  
  
END OF STEP 4 PROMPT
