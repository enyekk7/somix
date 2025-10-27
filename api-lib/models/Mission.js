const mongoose = require('mongoose');

const MissionProgressSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true,
    index: true
  },
  address: {
    type: String,
    required: true,
    index: true
  },
  completedMissions: [{
    type: String, // missionId
    default: []
  }],
  claimedMissions: [{
    type: String, // missionId
    default: []
  }],
  progress: {
    type: Map,
    of: Number,
    default: {}
  },
  dailyCheckin: {
    lastCheckinDate: {
      type: String,
      default: null
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    maxStreak: {
      type: Number,
      default: 0
    },
    checkinHistory: [{
      date: String,
      day: Number
    }]
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

MissionProgressSchema.index({ userId: 1 });
MissionProgressSchema.index({ address: 1 });

module.exports = mongoose.model('MissionProgress', MissionProgressSchema);
