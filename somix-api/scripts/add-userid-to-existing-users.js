require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/somix';

async function addUserIdToExistingUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all users without userId
    const usersWithoutId = await User.find({ userId: { $exists: false } });
    console.log(`Found ${usersWithoutId.length} users without userId`);

    // Get the highest userId
    const lastUser = await User.findOne().sort({ userId: -1 }).exec();
    let nextUserId = lastUser && lastUser.userId ? lastUser.userId + 1 : 1;

    // Update each user
    for (const user of usersWithoutId) {
      await User.findByIdAndUpdate(user._id, { userId: nextUserId });
      console.log(`✅ Added userId ${nextUserId} to user ${user.address}`);
      nextUserId++;
    }

    console.log(`\n✅ Successfully updated ${usersWithoutId.length} users`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addUserIdToExistingUsers();

