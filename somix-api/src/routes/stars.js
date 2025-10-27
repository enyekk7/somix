const express = require('express');
const User = require('../models/User');
const WithdrawService = require('../services/withdraw');
const router = express.Router();

// POST /api/stars/add - Add stars to creator when NFT is minted
router.post('/add', async (req, res) => {
  try {
    const { creatorAddress, starsAmount = 2 } = req.body;

    if (!creatorAddress) {
      return res.status(400).json({
        success: false,
        error: 'Creator address is required'
      });
    }

    console.log('⭐ Adding stars - Creator address:', creatorAddress);
    
    // Find user with case-insensitive search
    let user = await User.findOne({ address: creatorAddress.toLowerCase() });
    console.log('  - Lowercase search result:', user ? `Found (${user.username})` : 'Not found');
    
    if (!user) {
      // Try case-insensitive search as fallback
      user = await User.findOne({ 
        address: { $regex: new RegExp(`^${creatorAddress}$`, 'i') }
      });
      console.log('  - Case-insensitive search result:', user ? `Found (${user.username})` : 'Not found');
    }
    
    if (!user) {
      console.log('  - User not found, creating new user...');
      // Create user if not found (for mint rewards)
      const lastUser = await User.findOne().sort({ userId: -1 }).exec();
      const nextUserId = lastUser && lastUser.userId ? lastUser.userId + 1 : 1;
      
      // Generate unique username
      let baseUsername = `user_${creatorAddress.slice(2, 10)}`;
      let username = baseUsername;
      let counter = 1;
      
      while (await User.findOne({ username })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }
      
      try {
        user = await User.create({
          userId: nextUserId,
          address: creatorAddress.toLowerCase(),
          username: username,
          tokens: 100,
          stars: starsAmount,
          totalStarsEarned: starsAmount,
          isVerified: false,
          isSomixPro: false
        });
        
        console.log(`✅ Created new user for stars: ${username} (${starsAmount} stars)`);
      } catch (createError) {
        if (createError.code === 11000) {
          // Duplicate key error, find existing user
          user = await User.findOne({ 
            address: { $regex: new RegExp(`^${creatorAddress}$`, 'i') }
          });
          if (!user) {
            throw new Error('User creation failed and could not find existing user');
          }
        } else {
          throw createError;
        }
      }
    }
    
    // Add stars to existing user
    if (user && user.stars !== undefined) {
      console.log('  - Adding', starsAmount, 'stars to user (current:', user.stars, ')');
      user = await User.findOneAndUpdate(
        { _id: user._id },
        { 
          $inc: { 
            stars: starsAmount,
            totalStarsEarned: starsAmount
          }
        },
        { new: true }
      );
      console.log('  - Stars added! New total:', user.stars);
    }

    res.json({
      success: true,
      stars: user.stars,
      message: `Added ${starsAmount} stars to creator`
    });

  } catch (error) {
    console.error('Add stars error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to add stars'
    });
  }
});

// POST /api/stars/withdraw - Withdraw stars (creator gets STT)
router.post('/withdraw', async (req, res) => {
  try {
    const { address, starsToWithdraw } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required'
      });
    }

    if (!starsToWithdraw || starsToWithdraw <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid stars amount'
      });
    }

    // Get user with case-insensitive search
    let user = await User.findOne({ address: address.toLowerCase() });

    if (!user) {
      user = await User.findOne({ 
        address: { $regex: new RegExp(`^${address}$`, 'i') }
      });
    }

    if (!user) {
      console.log('❌ User not found for withdraw:', address);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log('💰 Withdraw attempt:', {
      address,
      currentStars: user.stars,
      requestStars: starsToWithdraw,
      username: user.username
    });

    if (user.stars < starsToWithdraw) {
      return res.status(400).json({
        success: false,
        error: 'Not enough stars to withdraw',
        available: user.stars
      });
    }

    // Process blockchain withdrawal
    const withdrawResult = await WithdrawService.withdrawStars(address, starsToWithdraw);
    
    if (withdrawResult.success) {
      // Update user - subtract stars (use _id to avoid case sensitivity issues)
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { 
          $inc: { 
            stars: -starsToWithdraw,
            totalStarsWithdrawn: starsToWithdraw
          }
        },
        { new: true }
      );

      res.json({
        success: true,
        message: `Successfully withdrew ${starsToWithdraw} stars (${withdrawResult.sttAmount} STT)`,
        stars: updatedUser.stars,
        withdrawn: starsToWithdraw,
        sttAmount: withdrawResult.sttAmount,
        txHash: withdrawResult.txHash,
        gasUsed: withdrawResult.gasUsed,
        blockNumber: withdrawResult.blockNumber
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Withdrawal failed'
      });
    }

  } catch (error) {
    console.error('Withdraw stars error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to withdraw stars'
    });
  }
});

// GET /api/stars/wallet-balance - Get developer wallet balance
router.get('/wallet-balance', async (req, res) => {
  try {
    console.log('🔍 Testing wallet balance endpoint...');
    
    // Test direct RPC call
    const { ethers } = require('ethers');
    const provider = new ethers.JsonRpcProvider('https://dream-rpc.somnia.network');
    const walletAddress = '0x862C8f5C105981d88675A4825ae9a7E62103ae39';
    
    console.log('  - Testing direct RPC call...');
    const directBalance = await provider.getBalance(walletAddress);
    console.log('  - Direct balance:', ethers.formatEther(directBalance), 'STT');
    
    // Test WithdrawService
    console.log('  - Testing WithdrawService...');
    const serviceBalance = await WithdrawService.getWalletBalance();
    const walletAddressFromService = await WithdrawService.getWalletAddress();
    
    console.log('  - Service balance:', serviceBalance, 'STT');
    console.log('  - Service address:', walletAddressFromService);
    
    res.json({
      success: true,
      balance: ethers.formatEther(directBalance), // Use direct balance instead
      walletAddress: walletAddressFromService,
      currency: 'STT',
      debug: {
        directBalance: ethers.formatEther(directBalance),
        serviceBalance: serviceBalance
      }
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wallet balance'
    });
  }
});

// GET /api/stars/:address - Get stars for a user
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;

    console.log('🔍 Getting stars for address:', address);

    // Try lowercase first (most common case)
    let user = await User.findOne({ address: address.toLowerCase() })
      .select('address stars totalStarsEarned totalStarsWithdrawn')
      .lean();

    console.log('  - Lowercase search result:', user ? 'Found' : 'Not found');

    if (!user) {
      // Try exact match
      user = await User.findOne({ address })
        .select('address stars totalStarsEarned totalStarsWithdrawn')
        .lean();
      console.log('  - Exact match result:', user ? 'Found' : 'Not found');
    }

    if (!user) {
      // Try case-insensitive search
      user = await User.findOne({ 
        address: { $regex: new RegExp(`^${address}$`, 'i') }
      })
      .select('address stars totalStarsEarned totalStarsWithdrawn')
      .lean();
      console.log('  - Case-insensitive result:', user ? 'Found' : 'Not found');
    }

    if (!user) {
      // Return 0 stars for new/unregistered users instead of 404
      console.log('  - No user found, returning 0 stars');
      return res.json({
        success: true,
        stars: 0,
        totalStarsEarned: 0,
        totalStarsWithdrawn: 0,
        withdrawableSTT: 0
      });
    }

    console.log('  - User found with stars:', user.stars);

    // Calculate withdrawable amount (1 star = 0.1 STT)
    const withdrawableSTT = (user.stars || 0) * 0.1;

    res.json({
      success: true,
      stars: user.stars || 0,
      totalStarsEarned: user.totalStarsEarned || 0,
      totalStarsWithdrawn: user.totalStarsWithdrawn || 0,
      withdrawableSTT: withdrawableSTT
    });

  } catch (error) {
    console.error('Get stars error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get stars'
    });
  }
});

module.exports = router;


