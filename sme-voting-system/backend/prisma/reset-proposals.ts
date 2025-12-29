import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Clearing proposals and votes...');

  // Delete votes first (foreign key constraint)
  const votesDeleted = await prisma.vote.deleteMany();
  console.log(`   Deleted ${votesDeleted.count} votes`);

  // Delete proposals
  const proposalsDeleted = await prisma.proposal.deleteMany();
  console.log(`   Deleted ${proposalsDeleted.count} proposals`);

  console.log('✅ Done! Database is now in sync with a fresh blockchain.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
