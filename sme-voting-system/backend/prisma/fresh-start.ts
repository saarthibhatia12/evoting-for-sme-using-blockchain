/**
 * Fresh Start Script
 * ===================
 * Run this script when you restart Hardhat to clean up old blockchain-related data.
 * This ensures your database stays in sync with the fresh blockchain.
 * 
 * What it does:
 * 1. Clears all votes (they were on old blockchain)
 * 2. Clears all proposals (old proposal IDs)
 * 3. Resets shareholder blockchain sync status
 * 4. Keeps shareholders in database (just need to re-sync to blockchain)
 * 
 * Usage:
 *   npx ts-node prisma/fresh-start.ts
 * 
 * Or add to package.json:
 *   "scripts": {
 *     "fresh-start": "npx ts-node prisma/fresh-start.ts"
 *   }
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function freshStart() {
  console.log('🔄 Starting fresh database cleanup...\n');

  try {
    // 1. Delete all votes (they reference old blockchain data)
    const deletedVotes = await prisma.vote.deleteMany({});
    console.log(`🗑️  Deleted ${deletedVotes.count} votes`);

    // 2. Delete all proposals (old blockchain proposal IDs)
    const deletedProposals = await prisma.proposal.deleteMany({});
    console.log(`🗑️  Deleted ${deletedProposals.count} proposals`);

    // 3. Count shareholders (we keep these, they'll be re-synced)
    const shareholderCount = await prisma.shareholder.count();
    console.log(`👥 Keeping ${shareholderCount} shareholders (will be re-synced to blockchain)`);

    console.log('\n✅ Fresh start complete!');
    console.log('\n📋 Next steps:');
    console.log('   1. Start Hardhat: npx hardhat node');
    console.log('   2. Deploy contract: npx hardhat run scripts/deploy.js --network localhost');
    console.log('   3. Start backend: npm run dev');
    console.log('   4. Shareholders will be automatically synced to blockchain\n');

  } catch (error) {
    console.error('❌ Error during fresh start:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

freshStart()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
