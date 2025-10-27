const express = require('express');
const Notification = require('../models/Notification');
const NotificationService = require('../services/notification');
const router = express.Router();

const notificationService = new NotificationService();

// GET /api/notifications - Ambil notifikasi user
router.get('/', async (req, res) => {
  try {
    const { address } = req.query;
    const { page = 1, limit = 20, type = 'all' } = req.query;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'User address is required'
      });
    }

    const result = await notificationService.getUserNotifications(address, {
      page: parseInt(page),
      limit: parseInt(limit),
      type
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get notifications'
    });
  }
});

// GET /api/notifications/unread-count - Hitung notifikasi belum dibaca
router.get('/unread-count', async (req, res) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'User address is required'
      });
    }

    const count = await notificationService.getUnreadCount(address);

    res.json({
      success: true,
      count
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get unread count'
    });
  }
});

// PUT /api/notifications/:id/read - Tandai notifikasi sebagai dibaca
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'User address is required'
      });
    }

    const notification = await notificationService.markAsRead(id, address);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      notification
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

// PUT /api/notifications/mark-all-read - Tandai semua notifikasi sebagai dibaca
router.put('/mark-all-read', async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'User address is required'
      });
    }

    const result = await notificationService.markAllAsRead(address);

    res.json({
      success: true,
      modifiedCount: result.modifiedCount,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Mark all as read error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
});

// POST /api/notifications/create - Buat notifikasi baru (untuk testing)
router.post('/create', async (req, res) => {
  try {
    const {
      recipientAddress,
      senderAddress,
      type,
      message,
      metadata
    } = req.body;

    if (!recipientAddress || !senderAddress || !type || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const notification = await notificationService.createNotification({
      recipientAddress,
      senderAddress,
      type,
      message,
      metadata
    });

    res.json({
      success: true,
      notification
    });

  } catch (error) {
    console.error('Create notification error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to create notification'
    });
  }
});

// Export notification service untuk digunakan di routes lain
router.notificationService = notificationService;

module.exports = router;
