# SME Voting System - Restart Guide

## 🎯 Quick Answer

**You only need to run `fresh-start` when you restart Hardhat.**

---

## 📋 Common Scenarios

### Scenario 1: Normal Development (Most Common)
**Situation:** Just making code changes to backend/frontend

```cmd
# DON'T restart Hardhat - keep it running!
# Just restart the service you're working on:

# For backend changes:
Terminal 3: Ctrl+C
cd backend
npm run dev

# For frontend changes:
Terminal 4: Ctrl+C
cd frontend
npm run dev
```

**Fresh-start needed?** ❌ NO

---

### Scenario 2: Hardhat Was Stopped
**Situation:** Computer restarted, terminal closed, or Hardhat crashed

```cmd
# You MUST restart from scratch:

# Option A: Manual
cd backend
npm run fresh-start

cd ..\smart-contracts
npx hardhat node          # New terminal
npx hardhat run scripts/deploy.js --network localhost  # Another terminal

cd ..\backend
npm run dev               # New terminal

cd ..\frontend
npm run dev               # New terminal

# Option B: Automated (EASY!)
# Just double-click: restart-project.bat
```

**Fresh-start needed?** ✅ YES

---

### Scenario 3: Testing a Specific Feature
**Situation:** Hardhat is running, just want to clear votes/proposals

```cmd
cd backend
npm run fresh-start
# Backend auto-syncs shareholders on next restart
npm run dev
```

**Fresh-start needed?** ✅ YES (but Hardhat keeps running)

---

## 🚀 Best Practice Workflow

### Initial Setup (Once)
```cmd
Terminal 1: cd smart-contracts && npx hardhat node
Terminal 2: cd smart-contracts && npx hardhat run scripts/deploy.js --network localhost
Terminal 3: cd backend && npm run dev
Terminal 4: cd frontend && npm run dev
```

### Daily Development
- **Keep Terminal 1 (Hardhat) running** 24/7 if possible
- Only restart backend/frontend as needed
- **No fresh-start needed** for code changes

### After Computer Restart
- Use `restart-project.bat` for one-click restart
- OR manually run fresh-start + restart all

---

## 🤖 Automated Restart

**Created:** `restart-project.bat` in project root

**Usage:**
1. Close all terminals
2. Double-click `restart-project.bat`
3. Wait ~20 seconds
4. All services will be running!

**What it does:**
1. ✅ Runs fresh-start
2. ✅ Starts Hardhat
3. ✅ Deploys contract
4. ✅ Starts backend
5. ✅ Starts frontend

---

## 📊 Decision Tree

```
Did you restart Hardhat?
│
├─ YES → Run fresh-start
│        Then restart all services
│
└─ NO → Just restart the service you changed
        (backend or frontend)
        No fresh-start needed
```

---

## 💡 Why Does This Happen?

**The Issue:**
- Hardhat blockchain: Resets to empty state (proposal IDs start at 1)
- Database: Keeps old data (votes for old proposal #1)
- Result: New proposal #1 incorrectly shows old votes

**The Fix:**
- Fresh-start deletes old votes/proposals from database
- Database matches fresh blockchain state
- No data mismatch!

---

## 🎬 TL;DR

**Normal work:** Keep Hardhat running, restart backend/frontend freely, **no fresh-start needed**

**After Hardhat restart:** Run `npm run fresh-start` OR use `restart-project.bat`

**Easiest option:** Use `restart-project.bat` - it handles everything!
