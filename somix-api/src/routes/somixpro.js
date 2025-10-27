const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Subscribe to SomixPro (payment via blockchain)
router.post('/subscribe', async (req, res) => {
  try {
    const { address, txHash } = req.body;
    
    if (!address) {
      return res.status(400).json({ 
        success: false, 
        error: 'Address is required' 
      });
    }
    
    // Find user - try lowercase first, then try as-is
    let user = await User.findOne({ address: address.toLowerCase() });
    
    if (!user) {
      // Try case-insensitive search
      user = await User.findOne({ 
        address: { $regex: new RegExp(`^${address}$`, 'i') }
      });
    }
    
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Check if already subscribed
    if (user.isSomixPro) {
      return res.status(400).json({ 
        success: false, 
        error: 'Already subscribed to SomixPro' 
      });
    }
    
    // Activate SomixPro status
    user.isSomixPro = true;
    
    // Add 500 tokens as benefit for subscribing to SomixPro
    const previousTokens = user.tokens || 0;
    user.tokens = previousTokens + 500;
    
    // Log transaction hash if provided
    if (txHash) {
      console.log(`SomixPro subscription for ${address}, txHash: ${txHash}`);
    }
    
    await user.save();
    
    console.log(`SomixPro activated for user ${address}, added 500 tokens (${previousTokens} -> ${user.tokens})`);
    
    res.json({ 
      success: true, 
      message: 'SomixPro subscription activated',
      isSomixPro: true,
      tokensAdded: 500,
      totalTokens: user.tokens
    });
  } catch (error) {
    console.error('SomixPro subscription error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to activate SomixPro subscription' 
    });
  }
});

// Check SomixPro status
router.get('/status/:address', async (req, res) => {
  try {
    const user = await User.findOne({ address: req.params.address.toLowerCase() });
    
    if (!user) {
      return res.json({ 
        success: true, 
        isSomixPro: false 
      });
    }
    
    res.json({ 
      success: true, 
      isSomixPro: user.isSomixPro || false 
    });
  } catch (error) {
    console.error('Check SomixPro status error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check SomixPro status' 
    });
  }
});

module.exports = router;
