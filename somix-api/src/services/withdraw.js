const { ethers } = require('ethers');

class WithdrawService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.SOMNIA_RPC_URL || 'https://dream-rpc.somnia.network');
    
    console.log('🔧 WithdrawService initialization:');
    console.log('  - RPC URL:', process.env.SOMNIA_RPC_URL || 'https://dream-rpc.somnia.network');
    console.log('  - Private Key length:', process.env.OWNER_PRIVATE_KEY ? process.env.OWNER_PRIVATE_KEY.length : 'undefined');
    console.log('  - Private Key prefix:', process.env.OWNER_PRIVATE_KEY ? process.env.OWNER_PRIVATE_KEY.substring(0, 6) + '...' : 'undefined');
    
    // Initialize wallet only if private key is valid
    try {
      if (process.env.OWNER_PRIVATE_KEY && process.env.OWNER_PRIVATE_KEY.length === 66) {
        this.wallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, this.provider);
        this.isWalletValid = true;
        console.log('  - Wallet initialized successfully');
        console.log('  - Wallet address:', this.wallet.address);
      } else {
        console.warn('  - Invalid or missing private key. Withdraw functionality will be disabled.');
        this.wallet = null;
        this.isWalletValid = false;
      }
    } catch (error) {
      console.error('  - Failed to initialize wallet:', error.message);
      this.wallet = null;
      this.isWalletValid = false;
    }
    
    this.withdrawRate = parseFloat(process.env.WITHDRAW_RATE) || 0.1; // 1 star = 0.1 STT
    console.log('  - Withdraw rate:', this.withdrawRate, 'STT per star');
  }

  async withdrawStars(userAddress, starsAmount) {
    try {
      if (!this.isWalletValid || !this.wallet) {
        throw new Error('Wallet not initialized. Please check private key configuration.');
      }

      console.log(`Processing withdrawal: ${starsAmount} stars to ${userAddress}`);
      
      // Convert stars to STT
      const sttAmount = ethers.parseEther((starsAmount * this.withdrawRate).toString());
      
      // Check wallet balance using direct RPC call (more reliable)
      const walletAddress = '0x862C8f5C105981d88675A4825ae9a7E62103ae39';
      const balance = await this.provider.getBalance(walletAddress);
      console.log(`Developer wallet balance: ${ethers.formatEther(balance)} STT`);
      
      if (balance < sttAmount) {
        throw new Error(`Insufficient wallet balance. Required: ${ethers.formatEther(sttAmount)} STT, Available: ${ethers.formatEther(balance)} STT`);
      }

      // Send STT to user using wallet instance
      console.log(`Sending ${ethers.formatEther(sttAmount)} STT to ${userAddress}`);
      const tx = await this.wallet.sendTransaction({
        to: userAddress,
        value: sttAmount,
        gasLimit: 21000
      });

      console.log(`Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`Transaction confirmed: ${receipt.status === 1 ? 'Success' : 'Failed'}`);
      
      return {
        success: true,
        txHash: tx.hash,
        sttAmount: ethers.formatEther(sttAmount),
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Withdraw error:', error);
      throw new Error(`Withdrawal failed: ${error.message}`);
    }
  }

  async getWalletBalance() {
    try {
      console.log('🔍 Getting wallet balance...');
      console.log('  - isWalletValid:', this.isWalletValid);
      console.log('  - wallet exists:', !!this.wallet);
      
      if (!this.isWalletValid || !this.wallet) {
        console.log('  - Wallet not valid, using direct RPC call...');
        // Fallback to direct RPC call
        const walletAddress = '0x862C8f5C105981d88675A4825ae9a7E62103ae39';
        const balance = await this.provider.getBalance(walletAddress);
        const formattedBalance = ethers.formatEther(balance);
        console.log('  - Direct RPC balance:', formattedBalance, 'STT');
        return formattedBalance;
      }
      
      console.log('  - Calling wallet.getBalance()...');
      const balance = await this.wallet.getBalance();
      console.log('  - Raw balance:', balance.toString());
      const formattedBalance = ethers.formatEther(balance);
      console.log('  - Formatted balance:', formattedBalance, 'STT');
      
      return formattedBalance;
    } catch (error) {
      console.error('❌ Get balance error:', error);
      return '0';
    }
  }

  async getWalletAddress() {
    if (!this.isWalletValid || !this.wallet) {
      return 'Wallet not initialized';
    }
    return this.wallet.address;
  }
}

module.exports = new WithdrawService();

// Also export the class for testing
module.exports.WithdrawService = WithdrawService;
