const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userId: {
    type: Number,
    unique: true,
    index: true
  },
  address: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_]+$/
  },
  avatarUrl: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 200,
    default: ''
  },
  // Stars system for NFT minting rewards
  stars: {
    type: Number,
    default: 0,
    min: 0
  },
  totalStarsEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  totalStarsWithdrawn: {
    type: Number,
    default: 0,
    min: 0
  },
  // Follow system
  followers: [{
    type: String, // Address of follower
    index: true
  }],
  following: [{
    type: String, // Address of user being followed
    index: true
  }],
  // Token system for AI image generation
  tokens: {
    type: Number,
    default: 100, // 100 free tokens on registration
    min: 0
  },
  // Verification and Premium Status
  isVerified: {
    type: Boolean,
    default: false
  },
  isSomixPro: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-generate userId before saving
UserSchema.pre('save', async function(next) {
  if (!this.userId) {
    try {
      // Get the last user's userId
      const lastUser = await mongoose.model('User').findOne().sort({ userId: -1 }).exec();
      this.userId = lastUser ? lastUser.userId + 1 : 1;
    } catch (error) {
      console.error('Error generating userId:', error);
      // Fallback: use timestamp as userId
      this.userId = Date.now();
    }
  }
  this.updatedAt = new Date();
  next();
});

// Create text index for username search
UserSchema.index({ username: 'text' });

module.exports = mongoose.model('User', UserSchema);


