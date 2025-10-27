const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const Mint = require('../models/Mint');
const NotificationService = require('../services/notification');
const router = express.Router();
const notificationService = new NotificationService();

// POST /api/users/add-userid - Add userId to all users without one (one-time migration)
router.post('/add-userid', async (req, res) => {
  try {
    // Find all users without userId
    const usersWithoutId = await User.find({ userId: { $exists: false } });
    
    if (usersWithoutId.length === 0) {
      return res.json({
        success: true,
        message: 'All users already have userId',
        count: 0
      });
    }

    // Get the highest userId
    const lastUser = await User.findOne().sort({ userId: -1 }).exec();
    let nextUserId = lastUser && lastUser.userId ? lastUser.userId + 1 : 1;

    // Update each user
    for (const user of usersWithoutId) {
      await User.findByIdAndUpdate(user._id, { userId: nextUserId });
      nextUserId++;
    }

    res.json({
      success: true,
      message: `Successfully added userId to ${usersWithoutId.length} users`,
      count: usersWithoutId.length
    });

  } catch (error) {
    console.error('Add userId error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to add userId to users'
    });
  }
});

// GET /api/users/top-creators - Get top creators based on algorithm
router.get('/top-creators', async (req, res) => {
  try {
    // Get all users
    const users = await User.find({}).select('address username avatarUrl bio followers isVerified isSomixPro');
    
    // Get all posts
    const posts = await Post.find({}).select('authorAddress');
    
    // Get all mints
    const mints = await Mint.find({}).select('minter');
    
    console.log(`📊 Calculating top creators for ${users.length} users...`);
    
    // Calculate scores for each user
    const creators = users.map(user => {
      // Count posts by this user (case-insensitive)
      const postCount = posts.filter(p => 
        p.authorAddress.toLowerCase() === user.address.toLowerCase()
      ).length;
      
      // Count mints by this user (case-insensitive)
      const mintCount = mints.filter(m => 
        m.minter.toLowerCase() === user.address.toLowerCase()
      ).length;
      
      // Get follower count
      const followerCount = user.followers?.length || 0;
      
      // Calculate individual scores
      const postsScore = postCount * 2;
      const mintsScore = mintCount * 10;
      const followersScore = followerCount * 1;
      const verifiedBonus = user.isVerified ? 100 : 0;
      const proBonus = user.isSomixPro ? 50 : 0;
      
      // Weighted total score
      const totalScore = 
        (postsScore * 0.25) +      // 25% weight on posts
        (mintsScore * 0.40) +      // 40% weight on mints (most important)
        (followersScore * 0.20) +   // 20% weight on followers
        (verifiedBonus * 0.10) +     // 10% weight on verification
        proBonus;                   // 5% bonus for Pro users
      
      return {
        _id: user._id,
        address: user.address,
        username: user.username,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        isVerified: user.isVerified || false,
        isSomixPro: user.isSomixPro || false,
        totalScore,
        postCount,
        mintCount,
        followerCount,
        stats: {
          posts: postCount,
          mints: mintCount,
          followers: followerCount
        }
      };
    });
    
    // Sort by total score descending and get top 100
    const topCreators = creators
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 100)
      .map((creator, index) => ({
        ...creator,
        rank: index + 1
      }));
    
    console.log(`✅ Top creators calculated: ${topCreators.length} creators`);
    
    res.json({ 
      success: true, 
      creators: topCreators,
      count: topCreators.length
    });
    
  } catch (error) {
    console.error('Get top creators error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get top creators'
    });
  }
});

// GET /api/users/by-id/:userId - Get user profile data by userId
router.get('/by-id/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdNum = parseInt(userId);

    if (isNaN(userIdNum)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid userId format'
      });
    }

    // Get user data by userId
    const user = await User.findOne({ userId: userIdNum })
      .select('userId address username avatarUrl bio stars followers following createdAt isVerified isSomixPro')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user's posts count - use case-insensitive search
    const postsCount = await Post.countDocuments({ 
      authorAddress: { $regex: new RegExp(`^${user.address}$`, 'i') }
    });

    // Get minted NFTs count (NFTs minted by this user) - use case-insensitive search
    const mintedCount = await Mint.countDocuments({ 
      minter: { $regex: new RegExp(`^${user.address}$`, 'i') }
    });

    // Calculate followers and following counts
    const followersCount = user.followers?.length || 0;
    const followingCount = user.following?.length || 0;

    res.json({
      success: true,
      user: {
        ...user,
        postsCount,
        mintedCount,
        followersCount,
        followingCount
      }
    });

  } catch (error) {
    console.error('Get user by userId error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get user data'
    });
  }
});

// POST /api/users/register - Auto-register new user
router.post('/register', async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required'
      });
    }

    // Check if user already exists (case-insensitive)
    let existingUser = await User.findOne({ address: address.toLowerCase() });
    
    if (!existingUser) {
      // Try case-insensitive search as fallback
      existingUser = await User.findOne({ 
        address: { $regex: new RegExp(`^${address}$`, 'i') }
      });
    }

    if (existingUser) {
      return res.json({
        success: true,
        message: 'User already exists',
        user: existingUser,
        isNewUser: false
      });
    }

    // Get the next userId
    const lastUser = await User.findOne().sort({ userId: -1 }).exec();
    const nextUserId = lastUser && lastUser.userId ? lastUser.userId + 1 : 1;

    // Generate unique username
    let baseUsername = `user_${address.slice(2, 10)}`;
    let username = baseUsername;
    let counter = 1;
    
    // Check for username conflicts and add suffix if needed
    while (await User.findOne({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Create new user with 100 free tokens
    const newUser = new User({
      userId: nextUserId,
      address: address.toLowerCase(),
      username: username,
      tokens: 100, // 100 free tokens for new users
      isVerified: false,
      isSomixPro: false,
      createdAt: new Date()
    });

    await newUser.save();

    console.log(`✅ New user registered: ${address} with 100 tokens`);

    res.json({
      success: true,
      message: 'User registered successfully',
      user: newUser,
      isNewUser: true
    });

  } catch (error) {
    console.error('Register user error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to register user'
    });
  }
});

// GET /api/users/:address - Get user profile data by address
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;

    // Get user data - try exact match first, then case-insensitive
    let user = await User.findOne({ address })
      .select('address username avatarUrl bio stars followers following createdAt isVerified isSomixPro')
      .lean();
    
    if (!user) {
      // Try case-insensitive search
      user = await User.findOne({ 
        address: { $regex: new RegExp(`^${address}$`, 'i') }
      })
      .select('address username avatarUrl bio stars followers following createdAt isVerified isSomixPro')
      .lean();
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user's posts count - use case-insensitive search
    const postsCount = await Post.countDocuments({ 
      authorAddress: { $regex: new RegExp(`^${user.address}$`, 'i') }
    });

    // Get minted NFTs count (NFTs minted by this user) - use case-insensitive search
    const mintedCount = await Mint.countDocuments({ 
      minter: { $regex: new RegExp(`^${user.address}$`, 'i') }
    });

    // Calculate followers and following counts
    const followersCount = user.followers?.length || 0;
    const followingCount = user.following?.length || 0;

    res.json({
      success: true,
      user: {
        ...user,
        postsCount,
        mintedCount,
        followersCount,
        followingCount
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get user data'
    });
  }
});

// GET /api/users/by-id/:userId/posts - Get user's posts by userId
router.get('/by-id/:userId/posts', async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdNum = parseInt(userId);

    if (isNaN(userIdNum)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid userId format'
      });
    }

    // Find user by userId to get address
    const user = await User.findOne({ userId: userIdNum }).select('address').lean();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize) || 20, 50);
    const skip = (page - 1) * pageSize;

    const posts = await Post.find({ 
      authorAddress: { $regex: new RegExp(`^${user.address}$`, 'i') }
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const totalCount = await Post.countDocuments({ 
      authorAddress: { $regex: new RegExp(`^${user.address}$`, 'i') }
    });

    res.json({
      success: true,
      posts,
      totalCount,
      hasMore: skip + posts.length < totalCount
    });

  } catch (error) {
    console.error('Get user posts by userId error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get user posts'
    });
  }
});

// GET /api/users/:address/posts - Get user's posts by address
router.get('/:address/posts', async (req, res) => {
  try {
    const { address } = req.params;
    const page = parseInt(req.query.page) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize) || 20, 50);
    const skip = (page - 1) * pageSize;

    // Use case-insensitive search for posts
    const posts = await Post.find({ 
      authorAddress: { $regex: new RegExp(`^${address}$`, 'i') }
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const totalCount = await Post.countDocuments({ 
      authorAddress: { $regex: new RegExp(`^${address}$`, 'i') }
    });

    res.json({
      success: true,
      posts,
      totalCount,
      hasMore: skip + posts.length < totalCount
    });

  } catch (error) {
    console.error('Get user posts error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get user posts'
    });
  }
});

// GET /api/users/by-id/:userId/minted - Get NFTs minted by user by userId
router.get('/by-id/:userId/minted', async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdNum = parseInt(userId);

    if (isNaN(userIdNum)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid userId format'
      });
    }

    // Find user by userId to get address
    const user = await User.findOne({ userId: userIdNum }).select('address').lean();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize) || 20, 50);
    const skip = (page - 1) * pageSize;

    const mints = await Mint.find({ 
      minter: { $regex: new RegExp(`^${user.address}$`, 'i') }
    })
      .populate({
        path: 'postId',
        select: 'caption image authorAddress',
        options: { lean: true }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const totalCount = await Mint.countDocuments({ 
      minter: { $regex: new RegExp(`^${user.address}$`, 'i') }
    });

    // Add image URL from post to each mint
    const mintsWithImages = mints.map(mint => {
      let imageUrl = null;
      
      if (mint.postId && mint.postId.image) {
        imageUrl = mint.postId.image.url || mint.postId.image.thumbUrl;
      }
      
      return {
        ...mint,
        imageUrl: imageUrl
      };
    });

    res.json({
      success: true,
      mints: mintsWithImages,
      totalCount,
      hasMore: skip + mints.length < totalCount
    });

  } catch (error) {
    console.error('Get user mints by userId error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get user mints'
    });
  }
});

// GET /api/users/:address/minted - Get NFTs minted by user by address
router.get('/:address/minted', async (req, res) => {
  try {
    const { address } = req.params;
    const page = parseInt(req.query.page) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize) || 20, 50);
    const skip = (page - 1) * pageSize;

    const mints = await Mint.find({ 
      minter: { $regex: new RegExp(`^${address}$`, 'i') }
    })
      .populate({
        path: 'postId',
        select: 'caption image authorAddress',
        options: { lean: true }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const totalCount = await Mint.countDocuments({ 
      minter: { $regex: new RegExp(`^${address}$`, 'i') }
    });

    // Add image URL from post to each mint
    const mintsWithImages = mints.map(mint => {
      let imageUrl = null;
      
      if (mint.postId && mint.postId.image) {
        imageUrl = mint.postId.image.url || mint.postId.image.thumbUrl;
      }
      
      return {
        ...mint,
        imageUrl: imageUrl
      };
    });

    res.json({
      success: true,
      mints: mintsWithImages,
      totalCount,
      hasMore: skip + mints.length < totalCount
    });

  } catch (error) {
    console.error('Get user mints error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get user mints'
    });
  }
});

// POST /api/users/:address/follow - Follow user
router.post('/:address/follow', async (req, res) => {
  try {
    const { address: targetAddress } = req.params;
    const { followerAddress } = req.body;

    if (!followerAddress) {
      return res.status(400).json({
        success: false,
        error: 'Follower address is required'
      });
    }

    if (targetAddress === followerAddress) {
      return res.status(400).json({
        success: false,
        error: 'Cannot follow yourself'
      });
    }

    // Check if already following
    const targetUser = await User.findOne({ address: targetAddress });
    if (targetUser.followers.includes(followerAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Already following this user'
      });
    }

    // Add follower to target user
    await User.findOneAndUpdate(
      { address: targetAddress },
      { $addToSet: { followers: followerAddress } }
    );

    // Add target to follower's following list
    await User.findOneAndUpdate(
      { address: followerAddress },
      { $addToSet: { following: targetAddress } }
    );

    // Create notification for followed user
    try {
      await notificationService.createFollowNotification(targetAddress, followerAddress);
    } catch (notifError) {
      console.error('Failed to create follow notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.json({
      success: true,
      message: 'Successfully followed user'
    });

  } catch (error) {
    console.error('Follow user error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to follow user'
    });
  }
});

// POST /api/users/:address/unfollow - Unfollow user
router.post('/:address/unfollow', async (req, res) => {
  try {
    const { address: targetAddress } = req.params;
    const { followerAddress } = req.body;

    if (!followerAddress) {
      return res.status(400).json({
        success: false,
        error: 'Follower address is required'
      });
    }

    // Remove follower from target user
    await User.findOneAndUpdate(
      { address: targetAddress },
      { $pull: { followers: followerAddress } }
    );

    // Remove target from follower's following list
    await User.findOneAndUpdate(
      { address: followerAddress },
      { $pull: { following: targetAddress } }
    );

    res.json({
      success: true,
      message: 'Successfully unfollowed user'
    });

  } catch (error) {
    console.error('Unfollow user error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to unfollow user'
    });
  }
});

// GET /api/users/:address/is-following - Check if user is following
router.get('/:address/is-following', async (req, res) => {
  try {
    const { address: targetAddress } = req.params;
    const { followerAddress } = req.query;

    if (!followerAddress) {
      return res.status(400).json({
        success: false,
        error: 'Follower address is required'
      });
    }

    const user = await User.findOne({ address: targetAddress })
      .select('followers')
      .lean();

    const isFollowing = user?.followers?.includes(followerAddress) || false;

    res.json({
      success: true,
      isFollowing
    });

  } catch (error) {
    console.error('Check following error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to check following status'
    });
  }
});

// PUT /api/users/:address/username - Update username and all related posts
router.put('/:address/username', async (req, res) => {
  try {
    const { address } = req.params;
    const { username } = req.body;

    console.log('Update username request:', { address, username });

    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username is required'
      });
    }

    // Validate username
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({
        success: false,
        error: 'Username must be between 3 and 30 characters'
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        success: false,
        error: 'Username can only contain letters, numbers, and underscores'
      });
    }

    // Check if username is already taken by another user
    const existingUser = await User.findOne({ 
      username: username, 
      address: { $ne: address } 
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Username is already taken'
      });
    }

    // Get current user - try exact match first, then case-insensitive
    let currentUser = await User.findOne({ address });
    if (!currentUser) {
      // Try case-insensitive search
      currentUser = await User.findOne({ 
        address: { $regex: new RegExp(`^${address}$`, 'i') }
      });
    }
    console.log('Found user:', currentUser ? 'Yes' : 'No', 'Address:', address, 'Found address:', currentUser?.address);
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const oldUsername = currentUser.username;

    // Update user username - use the found user's exact address
    const updatedUser = await User.findOneAndUpdate(
      { address: currentUser.address },
      { 
        username: username,
        updatedAt: new Date()
      },
      { new: true, select: 'userId address username avatarUrl bio followers following createdAt updatedAt' }
    );

    // Update all posts by this user with new username - use the found user's exact address
    const postsUpdateResult = await Post.updateMany(
      { authorAddress: currentUser.address },
      { 
        $set: { 
          'author.username': username,
          updatedAt: new Date()
        }
      }
    );

    console.log(`Updated ${postsUpdateResult.modifiedCount} posts with new username: ${username}`);

    // Get counts - use the found user's exact address
    const postsCount = await Post.countDocuments({ authorAddress: currentUser.address });
    const mintedCount = await Mint.countDocuments({ minter: currentUser.address });
    const followersCount = updatedUser.followers?.length || 0;
    const followingCount = updatedUser.following?.length || 0;

    res.json({
      success: true,
      message: `Username updated from "${oldUsername}" to "${username}". Updated ${postsUpdateResult.modifiedCount} posts.`,
      user: {
        ...updatedUser.toObject(),
        postsCount,
        mintedCount,
        followersCount,
        followingCount
      },
      postsUpdated: postsUpdateResult.modifiedCount
    });

  } catch (error) {
    console.error('Update username error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to update username'
    });
  }
});

// PUT /api/users/:address - Update user profile
router.put('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { username, bio, avatarUrl } = req.body;

    // Validate username if provided
    if (username) {
      if (username.length < 3 || username.length > 30) {
        return res.status(400).json({
          success: false,
          error: 'Username must be between 3 and 30 characters'
        });
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({
          success: false,
          error: 'Username can only contain letters, numbers, and underscores'
        });
      }

      // Check if username is already taken by another user
      const existingUser = await User.findOne({ 
        username: username, 
        address: { $ne: address } 
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Username is already taken'
        });
      }
    }

    // Validate bio if provided
    if (bio && bio.length > 200) {
      return res.status(400).json({
        success: false,
        error: 'Bio must be 200 characters or less'
      });
    }

    // Update user
    const updateData = {};
    if (username) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    updateData.updatedAt = new Date();

    const updatedUser = await User.findOneAndUpdate(
      { address },
      updateData,
      { new: true, select: 'userId address username avatarUrl bio followers following createdAt updatedAt' }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get counts
    const postsCount = await Post.countDocuments({ authorAddress: address });
    const mintedCount = await Mint.countDocuments({ minter: address });
    const followersCount = updatedUser.followers?.length || 0;
    const followingCount = updatedUser.following?.length || 0;

    res.json({
      success: true,
      user: {
        ...updatedUser.toObject(),
        postsCount,
        mintedCount,
        followersCount,
        followingCount
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to update user profile'
    });
  }
});

module.exports = router;

