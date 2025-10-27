const express = require('express');
const Post = require('../models/Post');
const Mint = require('../models/Mint');
const PinataService = require('../services/pinata');
const NotificationService = require('../services/notification');

const router = express.Router();
const pinata = new PinataService(
  process.env.PINATA_JWT || '',
  process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud'
);
const notificationService = new NotificationService();

// POST /api/nft/prepare-metadata-for-post
router.post('/prepare-metadata-for-post', async (req, res) => {
  try {
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({
        success: false,
        error: 'Post ID is required'
      });
    }

    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Check if minting is allowed
    if (!post.openMint) {
      return res.status(400).json({
        success: false,
        error: 'Minting is not allowed for this post'
      });
    }

    // Check edition cap
    if (post.editions.cap !== null && post.editions.minted >= post.editions.cap) {
      return res.status(400).json({
        success: false,
        error: 'Edition cap reached'
      });
    }

    // Convert image URL to IPFS URL if CID is available
    let imageUrl = post.image.url;
    if (post.image.cid) {
      // Use IPFS CID for better decentralization
      imageUrl = `ipfs://${post.image.cid}`;
    }
    
    // Create NFT metadata
    const metadata = {
      name: `SOMIX #${postId}`,
      description: post.caption,
      image: imageUrl,
      external_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/post/${postId}`,
      attributes: [
        {
          trait_type: 'Creator',
          value: post.authorAddress
        },
        {
          trait_type: 'AI Prompt',
          value: post.prompt
        },
        {
          trait_type: 'Tags',
          value: post.tags.join(', ')
        },
        {
          trait_type: 'Edition',
          value: `${post.editions.minted + 1}${post.editions.cap ? ` of ${post.editions.cap}` : ''}`
        },
        {
          trait_type: 'Created',
          value: new Date(post.createdAt).toISOString()
        }
      ]
    };

    // Upload metadata to IPFS
    const metadataUrl = await pinata.uploadMetadata(metadata);
    const tokenURI = metadataUrl.replace('https://gateway.pinata.cloud/ipfs/', 'ipfs://');

    res.json({
      success: true,
      tokenURI
    });

  } catch (error) {
    console.error('Prepare metadata error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to prepare metadata'
    });
  }
});

// POST /api/mints/record
router.post('/record', async (req, res) => {
  try {
    const {
      postId,
      tokenURI,
      txHash,
      tokenId,
      contractAddress,
      minter
    } = req.body;

    // Validate required fields
    if (!postId || !tokenURI || !txHash || tokenId === undefined || !contractAddress || !minter) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(minter)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid minter address format'
      });
    }

    // Validate contract address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid contract address format'
      });
    }

    // Check if transaction hash already exists
    const existingMint = await Mint.findOne({ txHash });
    if (existingMint) {
      return res.status(400).json({
        success: false,
        error: 'Transaction already recorded'
      });
    }

    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Check edition cap
    if (post.editions.cap !== null && post.editions.minted >= post.editions.cap) {
      return res.status(400).json({
        success: false,
        error: 'Edition cap reached'
      });
    }

    // Create mint record
    const mint = new Mint({
      postId,
      tokenURI,
      tokenId,
      txHash,
      contractAddress,
      minter
    });

    await mint.save();

    // Update post mint count
    await Post.findByIdAndUpdate(postId, {
      $inc: { 'editions.minted': 1 }
    });

    // Add stars to creator (2 stars per mint)
    try {
      const User = require('../models/User');
      const creatorAddress = post.authorAddress;
      
      console.log('⭐ Adding stars to creator:', creatorAddress);
      
      // Find or create user
      let user = await User.findOne({ address: creatorAddress.toLowerCase() });
      
      if (!user) {
        user = await User.findOne({ 
          address: { $regex: new RegExp(`^${creatorAddress}$`, 'i') }
        });
      }
      
      if (user) {
        // Add 2 stars to creator
        const updatedUser = await User.findOneAndUpdate(
          { _id: user._id },
          { 
            $inc: { 
              stars: 2,
              totalStarsEarned: 2
            }
          },
          { new: true }
        );
        console.log('✅ Added 2 stars to creator. Total stars:', updatedUser.stars);
      } else {
        console.log('⚠️ Creator not found, cannot add stars');
      }
    } catch (starsError) {
      console.error('Failed to add stars to creator:', starsError);
      // Don't fail the request if stars update fails
    }

    // Create notification for post author
    try {
      await notificationService.createMintNotification(
        post.authorAddress,
        minter,
        post.caption.length > 30 ? post.caption.substring(0, 30) + '...' : post.caption
      );
    } catch (notifError) {
      console.error('Failed to create mint notification:', notifError);
      // Don't fail the request if notification fails
    }

    // Update mission progress for minter (user who minted the NFT)
    try {
      const MissionProgress = require('../models/Mission');
      let minterProgress = await MissionProgress.findOne({ address: minter.toLowerCase() });
      
      if (!minterProgress) {
        // Find or create user first
        const User = require('../models/User');
        let minterUser = await User.findOne({ address: minter.toLowerCase() });
        
        if (!minterUser) {
          minterUser = await User.findOne({ 
            address: { $regex: new RegExp(`^${minter}$`, 'i') }
          });
        }
        
        if (minterUser) {
          // Create new progress document
          minterProgress = new MissionProgress({
            userId: minterUser.userId,
            address: minter.toLowerCase(),
            progress: {}
          });
          await minterProgress.save();
          console.log('✅ Created mission progress for minter:', minter);
        }
      }
      
      if (minterProgress) {
        // Get current mint count for this user
        const mintCount = await Mint.countDocuments({ minter });
        
        // Update progress for mint missions
        minterProgress.progress.set('mint_3_posts', Math.min(mintCount, 3));
        minterProgress.progress.set('mint_10_posts', Math.min(mintCount, 10));
        
        // Check if missions are completed
        if (!minterProgress.completedMissions.includes('mint_3_posts') && mintCount >= 3) {
          minterProgress.completedMissions.push('mint_3_posts');
          console.log('✅ Mission completed: mint_3_posts');
        }
        if (!minterProgress.completedMissions.includes('mint_10_posts') && mintCount >= 10) {
          minterProgress.completedMissions.push('mint_10_posts');
          console.log('✅ Mission completed: mint_10_posts');
        }
        
        minterProgress.updatedAt = new Date();
        await minterProgress.save();
        console.log('✅ Updated mission progress for minter');
      }
    } catch (missionError) {
      console.error('Failed to update mission progress:', missionError);
      // Don't fail the request if mission update fails
    }

    res.status(201).json({
      success: true
    });

  } catch (error) {
    console.error('Record mint error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to record mint'
    });
  }
});

// GET /api/mints/post/:postId
router.get('/post/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;
    const page = parseInt(req.query.page) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize) || 20, 50);
    const skip = (page - 1) * pageSize;

    const mints = await Mint.find({ postId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const totalCount = await Mint.countDocuments({ postId });
    const hasMore = skip + mints.length < totalCount;

    res.json({
      success: true,
      mints,
      hasMore,
      totalCount
    });

  } catch (error) {
    console.error('Get mints error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mints'
    });
  }
});

// GET /api/mints/user/:address
router.get('/user/:address', async (req, res) => {
  try {
    const address = req.params.address;
    const page = parseInt(req.query.page) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize) || 20, 50);
    const skip = (page - 1) * pageSize;

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address format'
      });
    }

    const mints = await Mint.find({ minter: address })
      .populate('postId', 'caption image authorAddress', Post)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const totalCount = await Mint.countDocuments({ minter: address });
    const hasMore = skip + mints.length < totalCount;

    res.json({
      success: true,
      mints,
      hasMore,
      totalCount
    });

  } catch (error) {
    console.error('Get user mints error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user mints'
    });
  }
});

module.exports = router;


