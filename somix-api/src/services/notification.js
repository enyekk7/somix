const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
  constructor() {
    this.connectedClients = new Map(); // WebSocket connections
  }

  // Tambahkan WebSocket client
  addClient(address, ws) {
    this.connectedClients.set(address, ws);
    console.log(`📱 Client connected: ${address}`);
  }

  // Hapus WebSocket client
  removeClient(address) {
    this.connectedClients.delete(address);
    console.log(`📱 Client disconnected: ${address}`);
  }

  // Kirim notifikasi real-time ke client yang terhubung
  async sendRealtimeNotification(recipientAddress, notification) {
    const client = this.connectedClients.get(recipientAddress);
    if (client && client.readyState === 1) { // WebSocket.OPEN
      try {
        client.send(JSON.stringify({
          type: 'notification',
          data: notification
        }));
        console.log(`📤 Real-time notification sent to ${recipientAddress}`);
      } catch (error) {
        console.error('Error sending real-time notification:', error);
        this.removeClient(recipientAddress);
      }
    }
  }

  // Buat notifikasi baru
  async createNotification({
    recipientAddress,
    senderAddress,
    type,
    message,
    metadata = {}
  }) {
    try {
      // Cari data pengirim dengan case-insensitive search
      let sender = await User.findOne({ address: senderAddress.toLowerCase() });
      
      if (!sender) {
        // Try case-insensitive search as fallback
        sender = await User.findOne({ 
          address: { $regex: new RegExp(`^${senderAddress}$`, 'i') }
        });
      }
      
      if (!sender) {
        // Buat user baru jika tidak ada
        // Get the next userId
        const lastUser = await User.findOne().sort({ userId: -1 }).exec();
        const nextUserId = lastUser && lastUser.userId ? lastUser.userId + 1 : 1;
        
        // Generate unique username
        let baseUsername = `user_${senderAddress.slice(2, 10)}`;
        let username = baseUsername;
        let counter = 1;
        
        // Check for username conflicts and add suffix if needed
        while (await User.findOne({ username })) {
          username = `${baseUsername}${counter}`;
          counter++;
        }
        
        try {
          sender = new User({
            userId: nextUserId,
            address: senderAddress.toLowerCase(),
            username: username,
            avatarUrl: null,
            tokens: 100, // 100 free tokens for new users
            isVerified: false,
            isSomixPro: false,
            followers: [],
            following: [],
            stars: 0
          });
          await sender.save();
          console.log(`📝 Created new user for notification: ${username} for ${senderAddress}`);
        } catch (createError) {
          if (createError.code === 11000) {
            // Duplicate key error, try to find the existing user again
            sender = await User.findOne({ 
              address: { $regex: new RegExp(`^${senderAddress}$`, 'i') }
            });
            if (!sender) {
              throw new Error('User creation failed and could not find existing user');
            }
            console.log(`⚠️ User already exists for notification, using existing: ${sender.username}`);
          } else {
            throw createError;
          }
        }
      }

      // Buat notifikasi
      const notification = new Notification({
        recipientAddress,
        senderAddress,
        senderUsername: sender.username || `user_${senderAddress.slice(2, 10)}`,
        senderAvatar: sender.avatarUrl || null,
        type,
        message,
        metadata
      });

      await notification.save();

      // Kirim notifikasi real-time
      await this.sendRealtimeNotification(recipientAddress, notification);

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Buat notifikasi untuk like
  async createLikeNotification(postCreatorAddress, likerAddress, postTitle) {
    return this.createNotification({
      recipientAddress: postCreatorAddress,
      senderAddress: likerAddress,
      type: 'like',
      message: `liked your post "${postTitle}"`,
      metadata: { postId: postTitle }
    });
  }

  // Buat notifikasi untuk mint
  async createMintNotification(postCreatorAddress, minterAddress, postTitle) {
    return this.createNotification({
      recipientAddress: postCreatorAddress,
      senderAddress: minterAddress,
      type: 'mint',
      message: `minted an NFT from your post "${postTitle}"`,
      metadata: { postId: postTitle }
    });
  }

  // Buat notifikasi untuk follow
  async createFollowNotification(followedAddress, followerAddress) {
    return this.createNotification({
      recipientAddress: followedAddress,
      senderAddress: followerAddress,
      type: 'follow',
      message: 'started following you'
    });
  }

  // Buat notifikasi untuk comment
  async createCommentNotification(postCreatorAddress, commenterAddress, postTitle) {
    return this.createNotification({
      recipientAddress: postCreatorAddress,
      senderAddress: commenterAddress,
      type: 'comment',
      message: `commented on your post "${postTitle}"`,
      metadata: { postId: postTitle }
    });
  }

  // Buat notifikasi achievement
  async createAchievementNotification(userAddress, achievementName) {
    return this.createNotification({
      recipientAddress: userAddress,
      senderAddress: 'system',
      senderUsername: 'SOMIX',
      type: 'achievement',
      message: `You earned the "${achievementName}" achievement!`,
      metadata: { achievementId: achievementName }
    });
  }

  // Ambil notifikasi user
  async getUserNotifications(userAddress, { page = 1, limit = 20, type = 'all' } = {}) {
    try {
      const query = { recipientAddress: userAddress };
      
      if (type !== 'all') {
        if (type === 'unread') {
          query.read = false;
        } else {
          query.type = type;
        }
      }

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Notification.countDocuments(query);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Tandai notifikasi sebagai dibaca
  async markAsRead(notificationId, userAddress) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipientAddress: userAddress },
        { read: true },
        { new: true }
      );

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Tandai semua notifikasi sebagai dibaca
  async markAllAsRead(userAddress) {
    try {
      const result = await Notification.updateMany(
        { recipientAddress: userAddress, read: false },
        { read: true }
      );

      return result;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Hitung notifikasi yang belum dibaca
  async getUnreadCount(userAddress) {
    try {
      const count = await Notification.countDocuments({
        recipientAddress: userAddress,
        read: false
      });

      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
