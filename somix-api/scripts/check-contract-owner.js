const { ethers } = require('ethers');

// Contract ABI untuk fungsi owner dan withdraw
const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "mintPrice",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// Konfigurasi
const CONTRACT_ADDRESS = '0x7580821e9C967Ce11c044ad95a911421eF62a604';
const DEVELOPER_WALLET = '0x862c8f5c105981d88675a4825ae9a7e62103ae39';
const RPC_URL = 'https://dream-rpc.somnia.network';

async function checkContractOwner() {
  try {
    console.log('🔍 Checking contract owner...');
    console.log('Contract Address:', CONTRACT_ADDRESS);
    console.log('Developer Wallet:', DEVELOPER_WALLET);
    console.log('RPC URL:', RPC_URL);
    
    // Buat provider
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // Buat contract instance
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    
    // Cek owner
    const owner = await contract.owner();
    console.log('📋 Contract Owner:', owner);
    
    // Cek mint price
    const mintPrice = await contract.mintPrice();
    console.log('💰 Mint Price:', ethers.formatEther(mintPrice), 'STT');
    
    // Cek balance contract
    const balance = await provider.getBalance(CONTRACT_ADDRESS);
    console.log('💳 Contract Balance:', ethers.formatEther(balance), 'STT');
    
    // Cek apakah developer wallet adalah owner
    const isDeveloperOwner = owner.toLowerCase() === DEVELOPER_WALLET.toLowerCase();
    console.log('✅ Is Developer Owner:', isDeveloperOwner);
    
    if (isDeveloperOwner) {
      console.log('🎉 Developer wallet is the contract owner!');
      console.log('💡 You can withdraw funds using the withdraw() function');
    } else {
      console.log('⚠️  Developer wallet is NOT the contract owner');
      console.log('💡 Current owner needs to call withdraw() or transfer ownership');
    }
    
    if (balance > 0) {
      console.log('💰 Contract has', ethers.formatEther(balance), 'STT available for withdrawal');
    } else {
      console.log('💸 Contract has no STT balance');
    }
    
  } catch (error) {
    console.error('❌ Error checking contract:', error.message);
  }
}

// Jalankan script
checkContractOwner();
