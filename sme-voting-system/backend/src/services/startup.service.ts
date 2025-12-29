import { ethers } from 'ethers';
import { prisma } from './database.service';
import { blockchainService } from './blockchain.service';

/**
 * Startup Service
 * Handles automatic synchronization of shareholders to blockchain on server start
 */
class StartupService {
  /**
   * Sync all shareholders from database to blockchain
   * Called automatically when the backend starts
   */
  async syncShareholdersToBlockchain(): Promise<void> {
    console.log('\n🔄 Auto-syncing shareholders to blockchain...');

    try {
      // Check if blockchain is connected
      const isConnected = await blockchainService.isConnected();
      if (!isConnected) {
        console.log('⚠️  Blockchain not connected. Skipping auto-sync.');
        return;
      }

      // Get all active shareholders from database
      const shareholders = await prisma.shareholder.findMany({
        where: { isActive: true },
        include: { shares: true },
      });

      if (shareholders.length === 0) {
        console.log('📋 No shareholders to sync.');
        return;
      }

      console.log(`📋 Found ${shareholders.length} shareholders to sync...\n`);

      let syncedCount = 0;
      let skippedCount = 0;
      let fundedCount = 0;

      // Process each shareholder sequentially
      for (const sh of shareholders) {
        const shares = sh.shares?.shares || 0;
        const shortAddr = `${sh.walletAddress.slice(0, 6)}...${sh.walletAddress.slice(-4)}`;

        if (shares <= 0) {
          console.log(`   ⏭️  ${sh.name} (${shortAddr}): Skipped (0 shares)`);
          skippedCount++;
          continue;
        }

        try {
          // Check current blockchain shares
          const currentShares = await blockchainService.getShares(sh.walletAddress);

          if (currentShares > 0n && BigInt(shares) === currentShares) {
            console.log(`   ✅ ${sh.name} (${shortAddr}): Already synced (${shares} shares)`);
            skippedCount++;
          } else {
            // First, fund wallet if needed (not admin)
            if (!sh.isAdmin) {
              const needsFunding = await this.checkNeedsFunding(sh.walletAddress);
              if (needsFunding) {
                const fundResult = await blockchainService.fundWallet(sh.walletAddress, '10');
                if (fundResult.success) {
                  console.log(`   💰 ${sh.name} (${shortAddr}): Funded with 10 ETH`);
                  fundedCount++;
                  // Wait for transaction to be fully processed before next operation
                  await this.delay(200);
                }
              }
            }

            // Then add shareholder to blockchain
            const result = await blockchainService.addShareholder(sh.walletAddress, shares);
            if (result.success) {
              console.log(`   ✅ ${sh.name} (${shortAddr}): Synced (${shares} shares)`);
              syncedCount++;
              // Wait for transaction to be fully processed before next shareholder
              await this.delay(200);
            } else {
              console.log(`   ❌ ${sh.name} (${shortAddr}): Failed - ${result.error}`);
            }
          }

        } catch (error: any) {
          console.log(`   ❌ ${sh.name} (${shortAddr}): Error - ${error.message}`);
        }
      }

      console.log(`\n✅ Sync complete: ${syncedCount} synced, ${skippedCount} skipped, ${fundedCount} funded\n`);

    } catch (error: any) {
      console.error('❌ Auto-sync failed:', error.message);
    }
  }

  /**
   * Check if a wallet needs funding (balance < 1 ETH)
   */
  private async checkNeedsFunding(walletAddress: string): Promise<boolean> {
    try {
      const provider = blockchainService.getProvider();
      if (!provider) return false;

      const balance = await provider.getBalance(walletAddress);
      const minBalance = ethers.parseEther('1'); // Minimum 1 ETH
      return balance < minBalance;
    } catch {
      return false;
    }
  }

  /**
   * Delay helper for transaction sequencing
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const startupService = new StartupService();
