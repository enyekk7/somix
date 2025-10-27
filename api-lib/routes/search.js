const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');

const router = express.Router();

// GET /api/search
router.get('/', async (req, res) => {
  try {
    const query = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize) || 20, 50);
    const skip = (page - 1) * pageSize;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    if (query.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Search query too long'
      });
    }

    // Sanitize search query
    const sanitizedQuery = query.trim().replace(/[<>]/g, '');

    // Search posts using text index with fallback to regex search
    let posts, totalCount;
    
    try {
      // Try text search first
      posts = await Post.find(
        { 
          $text: { $search: sanitizedQuery },
          visibility: 'public'
        },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean();

      totalCount = await Post.countDocuments({
        $text: { $search: sanitizedQuery },
        visibility: 'public'
      });
    } catch (textSearchError) {
      console.log('Text search failed, falling back to regex search:', textSearchError.message);
      
      // Fallback to regex search if text search fails
      posts = await Post.find({
        $and: [
          { visibility: 'public' },
          {
            $or: [
              { caption: { $regex: sanitizedQuery, $options: 'i' } },
              { tags: { $regex: sanitizedQuery, $options: 'i' } },
              { prompt: { $regex: sanitizedQuery, $options: 'i' } }
            ]
          }
        ]
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean();

      totalCount = await Post.countDocuments({
        $and: [
          { visibility: 'public' },
          {
            $or: [
              { caption: { $regex: sanitizedQuery, $options: 'i' } },
              { tags: { $regex: sanitizedQuery, $options: 'i' } },
              { prompt: { $regex: sanitizedQuery, $options: 'i' } }
            ]
          }
        ]
      });
    }
    const hasMore = skip + posts.length < totalCount;

    // Format results
    const formattedResults = posts.map(post => ({
      _id: post._id,
      author: {
        address: post.authorAddress,
        username: post.author?.username || `user_${post.authorAddress.slice(2, 10)}`,
        avatarUrl: post.author?.avatarUrl || null
      },
      image: {
        cid: post.image?.cid || '',
        url: post.image?.url || '',
        thumbUrl: post.image?.thumbUrl || '',
        blurHash: post.image?.blurHash || ''
      },
      caption: post.caption || '',
      prompt: post.prompt || '',
      tags: post.tags || [],
      openMint: post.openMint || false,
      editions: post.editions || { cap: null, minted: 0 },
      nftContractAddress: post.nftContractAddress || null,
      nftName: post.nftName || null,
      nftSymbol: post.nftSymbol || null,
      nftMintPrice: post.nftMintPrice || '0.2',
      nftMaxSupply: post.nftMaxSupply || 1000,
      likeCount: post.likeCount || 0,
      commentCount: post.commentCount || 0,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      score: post.score || 0
    }));

    res.json({
      success: true,
      results: formattedResults,
      hasMore
    });

  } catch (error) {
    console.error('Search error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

// GET /api/search/users
router.get('/users', async (req, res) => {
  try {
    const query = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize) || 20, 50);
    const skip = (page - 1) * pageSize;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    if (query.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Search query too long'
      });
    }

    // Sanitize search query
    const sanitizedQuery = query.trim().replace(/[<>]/g, '');

    // Search users by username
    const users = await User.find({
      $or: [
        { username: { $regex: sanitizedQuery, $options: 'i' } },
        { address: { $regex: sanitizedQuery, $options: 'i' } }
      ]
    })
      .sort({ username: 1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    // Get total count for pagination
    const totalCount = await User.countDocuments({
      $or: [
        { username: { $regex: sanitizedQuery, $options: 'i' } },
        { address: { $regex: sanitizedQuery, $options: 'i' } }
      ]
    });
    const hasMore = skip + users.length < totalCount;

    // Format results
    const formattedUsers = users.map(user => ({
      _id: user._id,
      address: user.address,
      username: user.username,
      avatarUrl: user.avatarUrl,
      bio: user.bio
    }));

    res.json({
      success: true,
      users: formattedUsers,
      hasMore,
      totalCount
    });

  } catch (error) {
    console.error('User search error:', error);
    
    res.status(500).json({
      success: false,
      error: 'User search failed'
    });
  }
});

// GET /api/search/tags
router.get('/tags', async (req, res) => {
  try {
    const query = req.query.q;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    // Sanitize search query
    const sanitizedQuery = query.trim().replace(/[<>]/g, '');

    // Get unique tags that match the query
    const posts = await Post.find({
      tags: { $regex: sanitizedQuery, $options: 'i' },
      visibility: 'public'
    })
      .select('tags')
      .lean();

    // Extract and count tags
    const tagCounts = {};
    posts.forEach(post => {
      post.tags.forEach(tag => {
        if (tag.toLowerCase().includes(sanitizedQuery.toLowerCase())) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      });
    });

    // Sort by count and return top tags
    const sortedTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));

    res.json({
      success: true,
      tags: sortedTags
    });

  } catch (error) {
    console.error('Tag search error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Tag search failed'
    });
  }
});

module.exports = router;


