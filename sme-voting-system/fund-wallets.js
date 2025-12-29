/**
 * Fund Shareholder Wallets Script
 * This script funds existing shareholder wallets with ETH for gas fees
 * Run this after the backend is started
 */

const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

// Your admin credentials - update these
const ADMIN_WALLET = '0xc674A160eD6780d2260f3B5b509b34Bf87D7dB67'; // Update with your admin wallet

async function fundWallet(token, walletAddress, amount = '10.0') {
  try {
    console.log(`💰 Funding wallet ${walletAddress}...`);
    
    const response = await axios.post(
      `${API_URL}/shareholders/fund/${walletAddress}`,
      { amount },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      console.log(`✅ Wallet funded successfully!`);
      console.log(`   TX Hash: ${response.data.data.txHash}`);
      console.log(`   Amount: ${response.data.data.amount} ETH\n`);
    }
  } catch (error) {
    console.error(`❌ Failed to fund wallet: ${error.response?.data?.error || error.message}\n`);
  }
}

async function getAllShareholders(token) {
  try {
    const response = await axios.get(
      `${API_URL}/shareholders`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return response.data.data.shareholders || [];
  } catch (error) {
    console.error(`❌ Failed to get shareholders: ${error.response?.data?.error || error.message}`);
    return [];
  }
}

async function loginAndGetToken() {
  console.log('\n🔐 Getting authentication token...');
  console.log('⚠️  You need to login manually and paste your JWT token here.\n');
  console.log('Steps:');
  console.log('1. Open your browser DevTools (F12)');
  console.log('2. Go to Console tab');
  console.log('3. Type: localStorage.getItem("token")');
  console.log('4. Copy the token (without quotes)');
  console.log('5. Paste it below:\n');
  
  // For Node.js - you'll need to paste the token
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    readline.question('Paste your JWT token: ', (token) => {
      readline.close();
      resolve(token);
    });
  });
}

async function main() {
  console.log('🚀 Shareholder Wallet Funding Script\n');
  
  // Get JWT token from user
  const token = await loginAndGetToken();
  
  if (!token) {
    console.error('❌ No token provided. Exiting.');
    return;
  }
  
  console.log('\n✅ Token received!\n');
  
  // Get all shareholders
  console.log('📋 Fetching shareholders...\n');
  const shareholders = await getAllShareholders(token);
  
  if (shareholders.length === 0) {
    console.log('No shareholders found.');
    return;
  }
  
  console.log(`Found ${shareholders.length} shareholders:\n`);
  
  // Fund each shareholder (except admin)
  for (const shareholder of shareholders) {
    console.log(`- ${shareholder.name} (${shareholder.walletAddress})`);
    
    // Skip admin wallet (it already has ETH)
    if (shareholder.isAdmin) {
      console.log('  ⏭️  Skipping (admin wallet already has ETH)\n');
      continue;
    }
    
    await fundWallet(token, shareholder.walletAddress, '10.0');
  }
  
  console.log('✅ Funding complete!');
  console.log('\n💡 Note: New shareholders will be automatically funded when created.');
}

main().catch(console.error);
