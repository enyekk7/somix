const mongoose = require('mongoose');

const LikeSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
  userAddress: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to prevent duplicate likes (temporarily disabled)
// LikeSchema.index({ postId: 1, userAddress: 1 }, { unique: true });

module.exports = mongoose.model('Like', LikeSchema);
