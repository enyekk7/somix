const { ethers } = require('ethers');

// Contract ABI untuk fungsi withdraw
const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// Konfigurasi
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x7580821e9C967Ce11c044ad95a911421eF62a604';
const DEVELOPER_WALLET = process.env.DEVELOPER_WALLET || '0x862c8f5c105981d88675a4825ae9a7e62103ae39';
const RPC_URL = process.env.RPC_URL || 'https://dream-rpc.somnia.network';

// Private key untuk wallet yang bisa melakukan withdraw (harus owner)
const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY;

async function withdrawToDeveloper() {
  try {
    if (!OWNER_PRIVATE_KEY) {
      console.log('❌ OWNER_PRIVATE_KEY environment variable is not set');
      console.log('💡 Please set the OWNER_PRIVATE_KEY in your .env file');
      console.log('💡 This should be the private key of the contract owner');
      return;
    }
    
    console.log('🚀 Starting withdraw process...');
    console.log('Contract Address:', CONTRACT_ADDRESS);
    console.log('Developer Wallet:', DEVELOPER_WALLET);
    
    // Buat provider dan wallet
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
    
    console.log('👤 Wallet Address:', wallet.address);
    
    // Buat contract instance dengan wallet
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
    
    // Cek owner
    const owner = await contract.owner();
    console.log('📋 Contract Owner:', owner);
    
    // Cek apakah wallet adalah owner
    if (wallet.address.toLowerCase() !== owner.toLowerCase()) {
      console.log('❌ Wallet is not the contract owner!');
      console.log('💡 Only the contract owner can withdraw funds');
      return;
    }
    
    // Cek balance sebelum withdraw
    const balanceBefore = await provider.getBalance(CONTRACT_ADDRESS);
    console.log('💳 Contract Balance Before:', ethers.formatEther(balanceBefore), 'STT');
    
    if (balanceBefore === 0n) {
      console.log('💸 No funds to withdraw');
      return;
    }
    
    // Lakukan withdraw
    console.log('💰 Withdrawing funds...');
    const tx = await contract.withdraw();
    console.log('📝 Transaction Hash:', tx.hash);
    
    // Tunggu konfirmasi
    console.log('⏳ Waiting for confirmation...');
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed!');
    console.log('📋 Block Number:', receipt.blockNumber);
    
    // Cek balance setelah withdraw
    const balanceAfter = await provider.getBalance(CONTRACT_ADDRESS);
    console.log('💳 Contract Balance After:', ethers.formatEther(balanceAfter), 'STT');
    
    // Cek balance developer wallet
    const developerBalance = await provider.getBalance(DEVELOPER_WALLET);
    console.log('💰 Developer Wallet Balance:', ethers.formatEther(developerBalance), 'STT');
    
    console.log('🎉 Withdraw completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during withdraw:', error.message);
    
    if (error.message.includes('insufficient funds')) {
      console.log('💡 Make sure the wallet has enough STT for gas fees');
    } else if (error.message.includes('execution reverted')) {
      console.log('💡 Transaction was reverted. Check if you are the contract owner');
    }
  }
}

// Jalankan script
withdrawToDeveloper();
