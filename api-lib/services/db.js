const mongoose = require('mongoose');

class DatabaseService {
  constructor() {
    this.isConnected = false;
  }

  static getInstance() {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async connect(mongoUri) {
    if (this.isConnected) {
      return;
    }

    try {
      await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
      });

      this.isConnected = true;
      console.log('✅ Connected to MongoDB');

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnected');
        this.isConnected = true;
      });

    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect() {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('✅ Disconnected from MongoDB');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  isConnectedToDatabase() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  async createIndexes() {
    try {
      // Create text indexes for search functionality
      await mongoose.connection.db.collection('posts').createIndex({
        caption: 'text',
        tags: 'text',
        prompt: 'text'
      });

      console.log('✅ Database indexes created');
    } catch (error) {
      console.error('❌ Error creating database indexes:', error);
      throw error;
    }
  }
}

module.exports = DatabaseService;

