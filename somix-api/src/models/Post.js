const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  authorAddress: {
    type: String,
    required: true,
    index: true
  },
  author: {
    username: {
      type: String,
      required: true
    },
    avatarUrl: {
      type: String,
      default: null
    }
  },
  caption: {
    type: String,
    required: true,
    maxlength: 500
  },
  prompt: {
    type: String,
    required: true,
    maxlength: 1000
  },
  tags: [{
    type: String,
    maxlength: 50
  }],
  visibility: {
    type: String,
    enum: ['public', 'followers'],
    default: 'public'
  },
  allowComments: {
    type: Boolean,
    default: true
  },
  openMint: {
    type: Boolean,
    default: false
  },
  editions: {
    cap: {
      type: Number,
      default: null,
      min: 1,
      max: 10000
    },
    minted: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  // NFT Contract fields
  nftContractAddress: {
    type: String,
    default: null
  },
  nftName: {
    type: String,
    default: null
  },
  nftSymbol: {
    type: String,
    default: null
  },
  nftMintPrice: {
    type: String,
    default: '0.2'
  },
  nftMaxSupply: {
    type: Number,
    default: 1000
  },
  image: {
    cid: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    thumbUrl: {
      type: String,
      required: true
    },
    blurHash: {
      type: String,
      required: true
    }
  },
  likeCount: {
    type: Number,
    default: 0,
    min: 0
  },
  commentCount: {
    type: Number,
    default: 0,
    min: 0
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

// Create text index for search functionality
PostSchema.index({
  caption: 'text',
  tags: 'text',
  prompt: 'text'
});

// Compound indexes for better query performance
PostSchema.index({ authorAddress: 1, createdAt: -1 });
PostSchema.index({ visibility: 1, createdAt: -1 });
PostSchema.index({ openMint: 1, createdAt: -1 });

module.exports = mongoose.model('Post', PostSchema);


