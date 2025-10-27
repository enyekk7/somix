const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Load environment variables
require('dotenv').config();

const DatabaseService = require('../api-lib/services/db');

// Import routes from api-lib folder
const aiRoutes = require('../api-lib/routes/ai');
const ipfsRoutes = require('../api-lib/routes/ipfs');
const postsRoutes = require('../api-lib/routes/posts');
const mintsRoutes = require('../api-lib/routes/mints');
const searchRoutes = require('../api-lib/routes/search');
const nftDeployRoutes = require('../api-lib/routes/nft-deploy');
const starsRoutes = require('../api-lib/routes/stars');
const usersRoutes = require('../api-lib/routes/users');
const notificationsRoutes = require('../api-lib/routes/notifications');
const withdrawRoutes = require('../api-lib/routes/withdraw');
const tokensRoutes = require('../api-lib/routes/tokens');
const somixproRoutes = require('../api-lib/routes/somixpro');
const missionsRoutes = require('../api-lib/routes/missions');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration - allow Vercel domain
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
  process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression middleware
app.use(compression());

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1000,
  message: {
    error: 'Too many requests',
    message: 'Please try again later'
  }
});

app.use(generalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production',
    vercel: {
      url: process.env.VERCEL_URL,
      env: process.env.VERCEL_ENV
    }
  });
});

// API routes
app.use('/api/ai', aiRoutes);
app.use('/api/ipfs', ipfsRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/mints', mintsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/deploy-nft', nftDeployRoutes);
app.use('/api/stars', starsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/withdraw', withdrawRoutes);
app.use('/api/tokens', tokensRoutes);
app.use('/api/somixpro', somixproRoutes);
app.use('/api/missions', missionsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message || 'Something went wrong'
  });
});

// Initialize database (async, non-blocking)
let dbInitialized = false;
let initPromise = null;

async function initializeDatabase() {
  if (dbInitialized) return Promise.resolve();
  if (initPromise) return initPromise;
  
  initPromise = new Promise(async (resolve) => {
    try {
      const dbService = DatabaseService.getInstance();
      const mongoUri = process.env.MONGO_URI;
      
      if (mongoUri) {
        console.log('🔄 Initializing database connection...');
        await dbService.connect(mongoUri);
        await dbService.createIndexes();
        console.log('✅ Database connected successfully');
        dbInitialized = true;
        resolve();
      } else {
        console.warn('⚠️ MONGO_URI not set, skipping database initialization');
        resolve();
      }
    } catch (dbError) {
      console.warn('⚠️ Database connection failed:', dbError.message);
      console.log('💡 Running without database');
      resolve();
    }
  });
  
  return initPromise;
}

// Initialize DB on serverless cold start (fire and forget)
initializeDatabase().catch(err => {
  console.error('Database initialization error:', err);
});

// Export for Vercel serverless function
module.exports = app;
