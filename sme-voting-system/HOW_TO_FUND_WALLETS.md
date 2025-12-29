# How to Fund Your Shareholder Wallet (Keep Demo Free)

## The Problem
When you try to vote, MetaMask says "You do not have enough ETH in your account to pay for network fees."

## The Solution
Your backend will now **automatically fund** shareholder wallets with 10 ETH (test ETH on local Hardhat network) when they are created.

---

## For NEW Shareholders (Automatic)
✅ **Nothing to do!** When you create a new shareholder through the Admin Dashboard, they will automatically receive 10 ETH for gas fees.

---

## For EXISTING Shareholders (Manual Fund)

### Option 1: Using Browser Console (Easiest)

1. **Login as Admin** in your browser
2. **Open DevTools** (Press F12)
3. **Go to Console tab**
4. **Paste this code** (replace the wallet address with your shareholder's wallet):

```javascript
// Replace with your shareholder's wallet address
const shareholderWallet = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

fetch('http://localhost:3001/api/shareholders/fund/' + shareholderWallet, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ amount: '10.0' })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Wallet funded!', data);
  alert('Wallet funded with 10 ETH!');
})
.catch(err => console.error('❌ Error:', err));
```

5. **Press Enter**
6. **You should see**: "✅ Wallet funded!"

---

### Option 2: Using Postman/Thunder Client

**Endpoint:** `POST http://localhost:3001/api/shareholders/fund/:walletAddress`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "amount": "10.0"
}
```

**Replace:**
- `:walletAddress` with your shareholder's wallet
- `YOUR_JWT_TOKEN` with your admin JWT token

---

### Option 3: Re-create the Shareholder

If it's easier, just **delete and re-create** the shareholder through the Admin Dashboard. The new shareholder will automatically be funded.

---

## Verify It Worked

After funding, check the wallet balance:

1. Open browser console on your frontend
2. Paste this code:

```javascript
const address = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // Your shareholder wallet

ethereum.request({
  method: 'eth_getBalance',
  params: [address, 'latest']
}).then(balance => {
  const eth = parseInt(balance) / 1e18;
  console.log(`Balance: ${eth} ETH`);
  alert(`Wallet has ${eth} ETH`);
});
```

**You should see:** "Balance: 10 ETH" (or more)

---

## Now Try Voting Again!

1. **Login as the shareholder**
2. **Click Vote on a proposal**
3. **MetaMask will show the transaction** with gas fees
4. **Confirm** - It should work now! 🎉

---

## Technical Details

### What Changed?

**Backend (`blockchain.service.ts`):**
- Added `fundWallet()` method
- `addShareholder()` now automatically calls `fundWallet()` with 10 ETH

**Why 10 ETH?**
- This is **test ETH** on the local Hardhat network (not real money!)
- 10 ETH is enough for thousands of transactions
- Each vote costs ~0.0001 ETH

**Where does the ETH come from?**
- The admin wallet (Hardhat's default account) has 10,000 ETH
- It's pre-funded by Hardhat for testing
- Completely free for development!

---

## For Production

In a real production environment on Ethereum mainnet:

**Option 1: Users pay their own gas** (most common)
- Users need to have ETH in their wallet
- They pay for their own transactions

**Option 2: Meta-transactions (gasless)**
- Backend pays gas fees on behalf of users
- More complex but better UX
- Uses services like OpenZeppelin Defender or Biconomy

For your **demo/testing**, Option 1 with auto-funding is perfect! 👍
