const express = require('express');
const { ethers } = require('ethers');

const router = express.Router();

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
const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY;

// POST /api/withdraw - Withdraw funds from contract to developer wallet
router.post('/', async (req, res) => {
  try {
    // Check if private key is set
    if (!OWNER_PRIVATE_KEY) {
      return res.status(500).json({
        success: false,
        error: 'OWNER_PRIVATE_KEY environment variable is not set'
      });
    }
    
    console.log('🚀 Starting automatic withdraw process...');
    
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
      return res.status(403).json({
        success: false,
        error: 'Wallet is not the contract owner'
      });
    }
    
    // Cek balance sebelum withdraw
    const balanceBefore = await provider.getBalance(CONTRACT_ADDRESS);
    console.log('💳 Contract Balance Before:', ethers.formatEther(balanceBefore), 'STT');
    
    if (balanceBefore === 0n) {
      return res.json({
        success: true,
        message: 'No funds to withdraw',
        balanceBefore: ethers.formatEther(balanceBefore),
        balanceAfter: ethers.formatEther(balanceBefore)
      });
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
    
    res.json({
      success: true,
      message: 'Withdraw completed successfully',
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      balanceBefore: ethers.formatEther(balanceBefore),
      balanceAfter: ethers.formatEther(balanceAfter),
      developerBalance: ethers.formatEther(developerBalance)
    });
    
  } catch (error) {
    console.error('❌ Error during withdraw:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
