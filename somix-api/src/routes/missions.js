const express = require('express');
const router = express.Router();
const MissionProgress = require('../models/Mission');
const User = require('../models/User');
const Post = require('../models/Post');
const Mint = require('../models/Mint');

// Define all available missions
const AVAILABLE_MISSIONS = {
  'create_3_posts': {
    id: 'create_3_posts',
    title: 'Create 3 Posts',
    description: 'Create 3 AI-generated posts',
    reward: 20,
    targetCount: 3
  },
  'create_5_posts': {
    id: 'create_5_posts',
    title: 'Create 5 Posts',
    description: 'Create 5 AI-generated posts',
    reward: 50,
    targetCount: 5
  },
  'mint_3_posts': {
    id: 'mint_3_posts',
    title: 'Mint 3 Posts',
    description: 'Mint 3 of your posts as NFTs',
    reward: 50,
    targetCount: 3
  },
  'mint_10_posts': {
    id: 'mint_10_posts',
    title: 'Mint 10 Posts',
    description: 'Mint 10 of your posts as NFTs',
    reward: 100,
    targetCount: 10
  },
  'follow_10_users': {
    id: 'follow_10_users',
    title: 'Follow 10 Users',
    description: 'Follow 10 different users',
    reward: 50,
    targetCount: 10
  },
  'get_10_followers': {
    id: 'get_10_followers',
    title: 'Get 10 Followers',
    description: 'Gain 10 followers on your profile',
    reward: 100,
    targetCount: 10
  }
};

// Get or create mission progress
router.get('/progress/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Find progress with case-insensitive search
    let progress = await MissionProgress.findOne({ address: address.toLowerCase() });
    
    if (!progress) {
      progress = await MissionProgress.findOne({ 
        address: { $regex: new RegExp(`^${address}$`, 'i') }
      });
    }
    
    if (!progress) {
      // Find user with case-insensitive search
      let user = await User.findOne({ address: address.toLowerCase() });
      
      if (!user) {
        user = await User.findOne({ 
          address: { $regex: new RegExp(`^${address}$`, 'i') }
        });
      }
      
      // Auto-register user if not found
      if (!user) {
        const userCount = await User.countDocuments();
        user = new User({
          userId: userCount + 1,
          address: address,
          username: `user${userCount + 1}`,
          displayName: `User ${userCount + 1}`,
          avatar: '',
          bio: '',
          followers: [],
          following: [],
          tokens: 0,
          isVerified: false,
          isSomixPro: false
        });
        await user.save();
        console.log(`✅ Auto-registered user: ${address}`);
      }
      
      progress = new MissionProgress({
        userId: user.userId,
        address: user.address,
        progress: {}
      });
      await progress.save();
    }
    
    // Calculate current progress for each mission
    const missionsWithProgress = Object.values(AVAILABLE_MISSIONS).map(mission => {
      const completed = progress.completedMissions.includes(mission.id);
      const claimed = progress.claimedMissions.includes(mission.id);
      const currentProgress = progress.progress.get(mission.id) || 0;
      
      return {
        ...mission,
        completed,
        claimed,
        progress: currentProgress,
        progressPercent: Math.min((currentProgress / mission.targetCount) * 100, 100)
      };
    });
    
    res.json({
      missions: missionsWithProgress,
      dailyCheckin: progress.dailyCheckin,
      totalCompleted: progress.completedMissions.length,
      totalTokens: missionsWithProgress
        .filter(m => m.claimed)
        .reduce((sum, m) => sum + m.reward, 0)
    });
  } catch (error) {
    console.error('Error getting mission progress:', error);
    res.status(500).json({ error: 'Failed to get mission progress' });
  }
});

// Check and update mission progress
router.post('/check-progress/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    let user = await User.findOne({ address });
    
    // Auto-register user if not found
    if (!user) {
      const userCount = await User.countDocuments();
      user = new User({
        userId: userCount + 1,
        address: address,
        username: `user${userCount + 1}`,
        displayName: `User ${userCount + 1}`,
        avatar: '',
        bio: '',
        followers: [],
        following: [],
        tokens: 0,
        isVerified: false,
        isSomixPro: false
      });
      await user.save();
      console.log(`✅ Auto-registered user: ${address}`);
    }
    
    let progress = await MissionProgress.findOne({ address });
    if (!progress) {
      progress = new MissionProgress({
        userId: user.userId,
        address: user.address,
        progress: {}
      });
    }
    
    // Count user's posts
    const postCount = await Post.countDocuments({ authorAddress: address });
    
    // Count user's mints (as minter)
    const mintCount = await Mint.countDocuments({ minter: address });
    
    console.log('📊 User progress data:', {
      address,
      postCount,
      mintCount,
      username: user.username
    });
    
    // Get follower/following counts
    const followCount = user.following?.length || 0;
    const followerCount = user.followers?.length || 0;
    
    // Update progress for each mission
    const updates = [];
    
    // Post missions
    if (!progress.completedMissions.includes('create_3_posts') && postCount >= 3) {
      progress.completedMissions.push('create_3_posts');
      updates.push('create_3_posts');
    }
    if (!progress.completedMissions.includes('create_5_posts') && postCount >= 5) {
      progress.completedMissions.push('create_5_posts');
      updates.push('create_5_posts');
    }
    
    // Mint missions
    if (!progress.completedMissions.includes('mint_3_posts') && mintCount >= 3) {
      progress.completedMissions.push('mint_3_posts');
      updates.push('mint_3_posts');
    }
    if (!progress.completedMissions.includes('mint_10_posts') && mintCount >= 10) {
      progress.completedMissions.push('mint_10_posts');
      updates.push('mint_10_posts');
    }
    
    // Follow missions
    if (!progress.completedMissions.includes('follow_10_users') && followCount >= 10) {
      progress.completedMissions.push('follow_10_users');
      updates.push('follow_10_users');
    }
    if (!progress.completedMissions.includes('get_10_followers') && followerCount >= 10) {
      progress.completedMissions.push('get_10_followers');
      updates.push('get_10_followers');
    }
    
    // Update progress values
    progress.progress.set('create_3_posts', Math.min(postCount, 3));
    progress.progress.set('create_5_posts', Math.min(postCount, 5));
    progress.progress.set('mint_3_posts', Math.min(mintCount, 3));
    progress.progress.set('mint_10_posts', Math.min(mintCount, 10));
    progress.progress.set('follow_10_users', Math.min(followCount, 10));
    progress.progress.set('get_10_followers', Math.min(followerCount, 10));
    
    progress.updatedAt = new Date();
    await progress.save();
    
    res.json({
      success: true,
      completedMissions: updates,
      message: updates.length > 0 ? `${updates.length} new mission(s) completed!` : 'No new missions completed'
    });
  } catch (error) {
    console.error('Error checking progress:', error);
    res.status(500).json({ error: 'Failed to check progress' });
  }
});

// Claim mission reward
router.post('/claim/:address/:missionId', async (req, res) => {
  try {
    const { address, missionId } = req.params;
    
    const mission = AVAILABLE_MISSIONS[missionId];
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    
    // Find user with case-insensitive search
    let user = await User.findOne({ address: address.toLowerCase() });
    
    if (!user) {
      user = await User.findOne({ 
        address: { $regex: new RegExp(`^${address}$`, 'i') }
      });
    }
    
    // Auto-register user if not found
    if (!user) {
      const userCount = await User.countDocuments();
      user = new User({
        userId: userCount + 1,
        address: address,
        username: `user${userCount + 1}`,
        displayName: `User ${userCount + 1}`,
        avatar: '',
        bio: '',
        followers: [],
        following: [],
        tokens: 0,
        isVerified: false,
        isSomixPro: false
      });
      await user.save();
      console.log(`✅ Auto-registered user: ${address}`);
    }
    
    // Find progress with case-insensitive search
    let progress = await MissionProgress.findOne({ address: address.toLowerCase() });
    
    if (!progress) {
      progress = await MissionProgress.findOne({ 
        address: { $regex: new RegExp(`^${address}$`, 'i') }
      });
    }
    
    if (!progress) {
      progress = new MissionProgress({
        userId: user.userId,
        address: user.address.toLowerCase(),
        progress: {}
      });
      await progress.save();
    }
    
    if (!progress.completedMissions.includes(missionId)) {
      return res.status(400).json({ error: 'Mission not completed yet' });
    }
    
    if (progress.claimedMissions.includes(missionId)) {
      return res.status(400).json({ error: 'Mission already claimed' });
    }
    
    console.log('💰 Claiming mission reward:', {
      missionId,
      reward: mission.reward,
      currentTokens: user.tokens,
      address,
      userId: user._id
    });
    
    // Add tokens to user using atomic update
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $inc: { tokens: mission.reward } },
      { new: true }
    );
    
    progress.claimedMissions.push(missionId);
    
    await progress.save();
    
    console.log('✅ Mission reward claimed:', {
      missionId,
      tokensAdded: mission.reward,
      oldBalance: user.tokens,
      newBalance: updatedUser.tokens
    });
    
    res.json({
      success: true,
      message: `You received ${mission.reward} tokens!`,
      tokensReceived: mission.reward,
      newBalance: updatedUser.tokens
    });
  } catch (error) {
    console.error('Error claiming reward:', error);
    res.status(500).json({ error: 'Failed to claim reward' });
  }
});

// Daily checkin
router.post('/checkin/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    let user = await User.findOne({ address });
    
    // Auto-register user if not found
    if (!user) {
      const userCount = await User.countDocuments();
      user = new User({
        userId: userCount + 1,
        address: address,
        username: `user${userCount + 1}`,
        displayName: `User ${userCount + 1}`,
        avatar: '',
        bio: '',
        followers: [],
        following: [],
        tokens: 0,
        isVerified: false,
        isSomixPro: false
      });
      await user.save();
      console.log(`✅ Auto-registered user: ${address}`);
    }
    
    let progress = await MissionProgress.findOne({ address });
    if (!progress) {
      progress = new MissionProgress({
        userId: user.userId,
        address: user.address,
        progress: {}
      });
    }
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // Check if already checked in today
    if (progress.dailyCheckin.lastCheckinDate === today) {
      return res.status(400).json({ error: 'Already checked in today' });
    }
    
    // Check if continuing streak
    let day = 1;
    let tokensReward = 50;
    
    if (progress.dailyCheckin.lastCheckinDate === yesterday) {
      // Continuing streak
      day = (progress.dailyCheckin.currentStreak + 1) % 7 || 7;
      if (day === 7) {
        tokensReward = 250;
      }
      progress.dailyCheckin.currentStreak += 1;
    } else {
      // New streak
      progress.dailyCheckin.currentStreak = 1;
    }
    
    if (progress.dailyCheckin.currentStreak > progress.dailyCheckin.maxStreak) {
      progress.dailyCheckin.maxStreak = progress.dailyCheckin.currentStreak;
    }
    
    // Add checkin to history
    progress.dailyCheckin.checkinHistory.push({
      date: today,
      day: day
    });
    
    // Limit history to last 30 days
    if (progress.dailyCheckin.checkinHistory.length > 30) {
      progress.dailyCheckin.checkinHistory = progress.dailyCheckin.checkinHistory.slice(-30);
    }
    
    progress.dailyCheckin.lastCheckinDate = today;
    
    // Add tokens to user
    user.tokens += tokensReward;
    
    await user.save();
    await progress.save();
    
    res.json({
      success: true,
      message: `Check-in successful! Day ${day} - ${tokensReward} tokens`,
      tokensReceived: tokensReward,
      newBalance: user.tokens,
      currentStreak: progress.dailyCheckin.currentStreak,
      day: day
    });
  } catch (error) {
    console.error('Error checking in:', error);
    res.status(500).json({ error: 'Failed to check in' });
  }
});

module.exports = router;
