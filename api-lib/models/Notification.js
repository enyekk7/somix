const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // User yang menerima notifikasi
  recipientAddress: {
    type: String,
    required: true,
    index: true
  },
  
  // User yang melakukan aksi (yang mengirim notifikasi)
  senderAddress: {
    type: String,
    required: true
  },
  
  // Username pengirim (untuk display)
  senderUsername: {
    type: String,
    required: true
  },
  
  // Avatar pengirim
  senderAvatar: {
    type: String,
    default: null
  },
  
  // Tipe notifikasi
  type: {
    type: String,
    required: true,
    enum: ['like', 'mint', 'follow', 'comment', 'achievement', 'system']
  },
  
  // Pesan notifikasi
  message: {
    type: String,
    required: true
  },
  
  // Data tambahan (post ID, NFT ID, dll)
  metadata: {
    postId: String,
    nftId: String,
    commentId: String,
    achievementId: String
  },
  
  // Status notifikasi
  read: {
    type: Boolean,
    default: false
  },
  
  // Waktu dibuat
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Index untuk performa
notificationSchema.index({ recipientAddress: 1, createdAt: -1 });
notificationSchema.index({ recipientAddress: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
