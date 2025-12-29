import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.vote.deleteMany();
  await prisma.authNonce.deleteMany();
  await prisma.share.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.shareholder.deleteMany();

  // Create admin user
  // You can set your own wallet address in .env as ADMIN_WALLET_ADDRESS
  const adminWalletAddress = process.env.ADMIN_WALLET_ADDRESS || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  
  const admin = await prisma.shareholder.create({
    data: {
      walletAddress: adminWalletAddress,
      name: 'Admin User',
      email: 'admin@example.com',
      isAdmin: true,
      isActive: true,
      shares: {
        create: {
          shares: 10000,
        },
      },
    },
  });

  console.log(`✅ Created admin user: ${admin.walletAddress}`);

  console.log('🎉 Database seeding completed!');
  console.log('📝 Admin can now login and add shareholders manually through the dashboard');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
