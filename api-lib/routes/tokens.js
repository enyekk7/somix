const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Deduct tokens (called when generating image) - MUST be before /:address route
router.post('/deduct', async (req, res) => {
  try {
    const { address, amount = 20 } = req.body;
    
    if (!address) {
      return res.status(400).json({ 
        success: false, 
        error: 'Address is required' 
      });
    }
    
    let user = await User.findOne({ address: address.toLowerCase() });
    
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        error: 'User not found. Please top up first.',
        currentTokens: 0,
        requiredTokens: amount
      });
    }
    
    const currentTokens = user.tokens || 0;
    
    if (currentTokens < amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Insufficient tokens',
        currentTokens,
        requiredTokens: amount
      });
    }
    
    user.tokens = currentTokens - amount;
    await user.save();
    
    console.log(`Tokens deducted for ${address}: ${currentTokens} - ${amount} = ${user.tokens}`);
    
    res.json({ 
      success: true, 
      tokens: user.tokens,
      deductedTokens: amount
    });
  } catch (error) {
    console.error('Deduct tokens error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to deduct tokens' 
    });
  }
});

// Get user tokens
router.get('/:address', async (req, res) => {
  try {
    const user = await User.findOne({ address: req.params.address.toLowerCase() });
    
    if (!user) {
      // Don't create user here, just return 0 - user will be created on first top-up or deduct
      return res.json({ 
        success: true, 
        tokens: 0
      });
    }
    
    res.json({ 
      success: true, 
      tokens: user.tokens || 0
    });
  } catch (error) {
    console.error('Get tokens error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get tokens' 
    });
  }
});

// Top-up tokens
router.post('/topup', async (req, res) => {
  try {
    const { address, amount, txHash } = req.body;
    
    if (!address || !amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Address and amount are required' 
      });
    }
    
    // Validate amount (only allow 100, 300, or 500 tokens)
    const validAmounts = [100, 300, 500];
    if (!validAmounts.includes(amount)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid amount. Only 100, 300, or 500 tokens allowed' 
      });
    }
    
    // Log payment info
    if (txHash) {
      console.log(`Top-up payment confirmed: ${txHash} for ${amount} tokens`);
    }
    
    let user = await User.findOne({ address: address.toLowerCase() });
    
    if (!user) {
      // Create new user with 100 free tokens + purchased tokens
      user = new User({
        address: address.toLowerCase(),
        username: `user_${address.slice(0, 8)}`,
        tokens: 100 + amount // 100 free + purchased tokens
      });
      console.log(`Created new user ${address} with ${user.tokens} tokens (100 free + ${amount} purchased). Payment: ${txHash || 'pending'}`);
    } else {
      // Add tokens to existing user
      const oldTokens = user.tokens || 0;
      user.tokens = oldTokens + amount;
      console.log(`Added ${amount} tokens to user ${address}: ${oldTokens} + ${amount} = ${user.tokens}. Payment: ${txHash || 'pending'}`);
    }
    
    await user.save();
    
    res.json({ 
      success: true, 
      tokens: user.tokens,
      addedTokens: amount,
      txHash: txHash || 'pending'
    });
  } catch (error) {
    console.error('Top-up error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to top-up tokens' 
    });
  }
});

module.exports = router;
