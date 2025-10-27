const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
const Like = require('../models/Like');
const PinataService = require('../services/pinata');
const NotificationService = require('../services/notification');

const router = express.Router();
const pinata = new PinataService(
  process.env.PINATA_JWT || '',
  process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud'
);
const notificationService = new NotificationService();

// POST /api/posts
router.post('/', async (req, res) => {
  try {
    const {
      authorAddress,
      caption,
      prompt,
      tags,
      visibility,
      allowComments,
      openMint,
      editions,
      image
    } = req.body;

    // Validate required fields
    if (!authorAddress || !caption || !prompt || !image) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Validate image object has required fields
    if (!image.blurHash || !image.thumbUrl) {
      console.error('❌ Invalid image data received:', {
        hasBlurHash: !!image.blurHash,
        hasThumbUrl: !!image.thumbUrl,
        hasUrl: !!image.url,
        hasCid: !!image.cid
      });
      
      // Provide defaults if missing
      if (!image.blurHash) {
        image.blurHash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';
        console.log('🔧 Set default blurHash');
      }
      if (!image.thumbUrl) {
        image.thumbUrl = image.url || 'https://via.placeholder.com/400';
        console.log('🔧 Set default thumbUrl');
      }
      if (!image.cid) {
        image.cid = 'fallback';
        console.log('🔧 Set default cid');
      }
    }

    // Validate author address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(authorAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format'
      });
    }

    // Validate caption length
    if (caption.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Caption must be 500 characters or less'
      });
    }

    // Validate prompt length
    if (prompt.length > 200) {
      return res.status(400).json({
        success: false,
        error: 'Prompt must be 200 characters or less'
      });
    }

    // Find user with case-insensitive search
    let user = await User.findOne({ address: authorAddress.toLowerCase() });
    
    if (!user) {
      // Try case-insensitive search as fallback
      user = await User.findOne({ 
        address: { $regex: new RegExp(`^${authorAddress}$`, 'i') }
      });
    }
    
    if (!user) {
      // Only create new user if they truly don't exist
      // Get the next userId
      const lastUser = await User.findOne().sort({ userId: -1 }).exec();
      const nextUserId = lastUser && lastUser.userId ? lastUser.userId + 1 : 1;
      
      // Generate unique username
      let baseUsername = `user_${authorAddress.slice(2, 10)}`;
      let username = baseUsername;
      let counter = 1;
      
      // Check for username conflicts and add suffix if needed
      while (await User.findOne({ username })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }
      
      try {
        user = await User.create({
          userId: nextUserId,
          address: authorAddress.toLowerCase(),
          username: username,
          tokens: 100, // 100 free tokens for new users
          isVerified: false,
          isSomixPro: false
        });
        console.log(`✅ Created new user: ${username} for ${authorAddress}`);
      } catch (createError) {
        if (createError.code === 11000) {
          // Duplicate key error, try to find the existing user again
          user = await User.findOne({ 
            address: { $regex: new RegExp(`^${authorAddress}$`, 'i') }
          });
          if (!user) {
            throw new Error('User creation failed and could not find existing user');
          }
          console.log(`⚠️ User already exists, using existing: ${user.username}`);
        } else {
          throw createError;
        }
      }
    }

    // Create post
    const post = new Post({
      authorAddress,
      author: {
        username: user.username,
        avatarUrl: user.avatarUrl
      },
      caption: caption.trim(),
      prompt: prompt.trim(),
      tags: tags || [],
      visibility: visibility || 'public',
      allowComments: allowComments !== false,
      openMint: openMint || false,
      editions: {
        cap: editions.cap,
        minted: 0
      },
      image,
      likeCount: 0,
      commentCount: 0
    });

    await post.save();

    res.status(201).json({
      success: true,
      postId: post._id,
      post: {
        _id: post._id,
        authorAddress: post.authorAddress,
        author: post.author,
        caption: post.caption,
        prompt: post.prompt,
        tags: post.tags,
        visibility: post.visibility,
        allowComments: post.allowComments,
        openMint: post.openMint,
        editions: post.editions,
        image: post.image,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        createdAt: post.createdAt
      }
    });

  } catch (error) {
    console.error('Create post error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to create post'
    });
  }
});

// GET /api/posts
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const skip = (page - 1) * pageSize;

    const posts = await Post.find({ visibility: 'public' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    // Fetch user data for each post to get isVerified and isSomixPro
    const postsWithUserData = await Promise.all(
      posts.map(async (post) => {
        if (post.authorAddress) {
          // Use case-insensitive search for user address
          let user = await User.findOne({ address: post.authorAddress.toLowerCase() });
          
          if (!user) {
            // Try case-insensitive search as fallback
            user = await User.findOne({ 
              address: { $regex: new RegExp(`^${post.authorAddress}$`, 'i') }
            });
          }
          
          if (user) {
            // Always replace author data with fresh data from User model
            post.author = {
              username: user.username,
              avatarUrl: user.avatarUrl,
              userId: user.userId,
              address: user.address,
              isVerified: user.isVerified || false,
              isSomixPro: user.isSomixPro || false
            };
            console.log(`✅ Updated post author data for ${user.username}: isVerified=${user.isVerified}, isSomixPro=${user.isSomixPro}`);
          } else {
            console.log(`⚠️ User not found for address: ${post.authorAddress}`);
          }
        }
        return post;
      })
    );

    const totalPosts = await Post.countDocuments({ visibility: 'public' });
    const hasMore = skip + posts.length < totalPosts;

    res.json({
      success: true,
      posts: postsWithUserData,
      pagination: {
        page,
        pageSize,
        totalPosts,
        hasMore
      }
    });

  } catch (error) {
    console.error('Get posts error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch posts'
    });
  }
});

// GET /api/posts/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id).lean();
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    res.json({
      success: true,
      post
    });

  } catch (error) {
    console.error('Get post error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch post'
    });
  }
});

// PUT /api/posts/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { authorAddress, caption, prompt, tags, visibility, allowComments, openMint, editions } = req.body;

    // Validate author address
    if (!authorAddress) {
      return res.status(400).json({
        success: false,
        error: 'Author address is required'
      });
    }

    // Find the post
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Verify ownership
    if (post.authorAddress.toLowerCase() !== authorAddress.toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: 'You can only edit your own posts'
      });
    }

    // Update post
    const updateData = {};
    if (caption !== undefined) updateData.caption = caption.trim();
    if (prompt !== undefined) updateData.prompt = prompt.trim();
    if (tags !== undefined) updateData.tags = tags;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (allowComments !== undefined) updateData.allowComments = allowComments;
    if (openMint !== undefined) updateData.openMint = openMint;
    if (editions !== undefined) updateData.editions = editions;

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      post: updatedPost
    });

  } catch (error) {
    console.error('Update post error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to update post'
    });
  }
});

// POST /api/posts/:id/like
router.post('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { userAddress } = req.body;

    if (!userAddress) {
      return res.status(400).json({
        success: false,
        error: 'User address is required'
      });
    }

    // Find the post
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Check if user already liked this post
    const existingLike = await Like.findOne({ postId: id, userAddress });
    if (existingLike) {
      return res.status(400).json({
        success: false,
        error: 'You have already liked this post'
      });
    }

    // Create like record
    try {
      const like = new Like({
        postId: id,
        userAddress,
        createdAt: new Date()
      });
      await like.save();
    } catch (duplicateError) {
      if (duplicateError.code === 11000) {
        return res.status(400).json({
          success: false,
          error: 'You have already liked this post'
        });
      }
      throw duplicateError;
    }

    // Increment like count
    await Post.findByIdAndUpdate(id, { $inc: { likeCount: 1 } });

    // Create notification for post author
    try {
      await notificationService.createLikeNotification(
        post.authorAddress,
        userAddress,
        post.caption.length > 30 ? post.caption.substring(0, 30) + '...' : post.caption
      );
    } catch (notifError) {
      console.error('Failed to create like notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.json({
      success: true,
      message: 'Post liked successfully'
    });

  } catch (error) {
    console.error('Like post error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to like post'
    });
  }
});

// POST /api/posts/:id/unlike
router.post('/:id/unlike', async (req, res) => {
  try {
    const { id } = req.params;
    const { userAddress } = req.body;

    if (!userAddress) {
      return res.status(400).json({
        success: false,
        error: 'User address is required'
      });
    }

    // Find and remove the like
    const like = await Like.findOneAndDelete({ postId: id, userAddress });
    if (!like) {
      return res.status(400).json({
        success: false,
        error: 'You have not liked this post'
      });
    }

    // Decrement like count
    await Post.findByIdAndUpdate(id, { $inc: { likeCount: -1 } });

    res.json({
      success: true,
      message: 'Post unliked successfully'
    });

  } catch (error) {
    console.error('Unlike post error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to unlike post'
    });
  }
});

// GET /api/posts/:id/like-status - Check if user has liked a post
router.get('/:id/like-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { userAddress } = req.query;

    if (!userAddress) {
      return res.status(400).json({
        success: false,
        error: 'User address is required'
      });
    }

    // Check if user has liked this post
    const like = await Like.findOne({ postId: id, userAddress });
    
    res.json({
      success: true,
      hasLiked: !!like,
      likeId: like ? like._id : null
    });

  } catch (error) {
    console.error('Check like status error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to check like status'
    });
  }
});

// DELETE /api/posts/:id - Delete a post
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { authorAddress } = req.body;

    if (!authorAddress) {
      return res.status(400).json({
        success: false,
        error: 'Author address is required'
      });
    }

    // Find the post and verify ownership
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Verify that the requester is the author
    if (post.authorAddress.toLowerCase() !== authorAddress.toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own posts'
      });
    }

    // Delete all likes associated with this post
    await Like.deleteMany({ postId: id });

    // Delete the post
    await Post.findByIdAndDelete(id);

    console.log(`Post ${id} deleted by ${authorAddress}`);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Delete post error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete post'
    });
  }
});

module.exports = router;