import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.vote.deleteMany();
  await prisma.authNonce.deleteMany();
  await prisma.share.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.shareholder.deleteMany();

  // Create sample shareholders
  const shareholders = await Promise.all([
    prisma.shareholder.create({
      data: {
        walletAddress: '0x1234567890123456789012345678901234567890',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        shares: {
          create: {
            shares: 1000,
          },
        },
      },
    }),
    prisma.shareholder.create({
      data: {
        walletAddress: '0x2345678901234567890123456789012345678901',
        name: 'Bob Smith',
        email: 'bob@example.com',
        shares: {
          create: {
            shares: 500,
          },
        },
      },
    }),
    prisma.shareholder.create({
      data: {
        walletAddress: '0x3456789012345678901234567890123456789012',
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        shares: {
          create: {
            shares: 750,
          },
        },
      },
    }),
  ]);

  console.log(`✅ Created ${shareholders.length} shareholders`);

  // Create sample proposals
  const proposals = await Promise.all([
    prisma.proposal.create({
      data: {
        proposalId: 1,
        title: 'Increase Annual Dividend by 5%',
        description: 'Proposal to increase the annual dividend payout to shareholders by 5%',
        startTime: new Date(),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        isActive: true,
      },
    }),
    prisma.proposal.create({
      data: {
        proposalId: 2,
        title: 'Approve New Board Member',
        description: 'Vote to approve John Doe as a new member of the board of directors',
        startTime: new Date(),
        endTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${proposals.length} proposals`);

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
