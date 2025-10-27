const mongoose = require('mongoose');

const MintSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true
  },
  tokenURI: {
    type: String,
    required: true
  },
  tokenId: {
    type: Number,
    required: true,
    min: 0
  },
  txHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  contractAddress: {
    type: String,
    required: true,
    index: true
  },
  minter: {
    type: String,
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes for better query performance
MintSchema.index({ postId: 1, createdAt: -1 });
MintSchema.index({ minter: 1, createdAt: -1 });
MintSchema.index({ contractAddress: 1, tokenId: 1 });

module.exports = mongoose.model('Mint', MintSchema);


