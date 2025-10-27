const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();

const DatabaseService = require('./services/db');

// Import routes
const aiRoutes = require('./routes/ai');
const ipfsRoutes = require('./routes/ipfs');
const postsRoutes = require('./routes/posts');
const mintsRoutes = require('./routes/mints');
const searchRoutes = require('./routes/search');
const nftDeployRoutes = require('./routes/nft-deploy');
const starsRoutes = require('./routes/stars');
const usersRoutes = require('./routes/users');
const notificationsRoutes = require('./routes/notifications');
const withdrawRoutes = require('./routes/withdraw');
const tokensRoutes = require('./routes/tokens');
const somixproRoutes = require('./routes/somixpro');
const missionsRoutes = require('./routes/missions');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Trust proxy - Required for Railway/Vercel deployments
app.set('trust proxy', true);

// WebSocket Server
const wss = new WebSocket.Server({ server });

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174', 
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179',
  'http://localhost:5180',
  'https://somix.network',
  'https://www.somix.network',
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
  process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || 
        origin.includes('vercel.app') || 
        origin.includes('railway.app') ||
        origin.includes('somix.network')) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
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
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute (much more lenient for development)
  message: {
    error: 'Too many requests',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    mongoDb: 'Checking...'
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
    error: 'API endpoint not found'
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

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('🔌 New WebSocket connection');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'auth' && data.address) {
        // Authenticate user and add to notification service
        notificationsRoutes.notificationService.addClient(data.address, ws);
        ws.userAddress = data.address;
        console.log(`🔐 User authenticated: ${data.address}`);
        
        // Send confirmation
        ws.send(JSON.stringify({
          type: 'auth_success',
          message: 'Connected to notifications'
        }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    if (ws.userAddress) {
      notificationsRoutes.notificationService.removeClient(ws.userAddress);
    }
    console.log('🔌 WebSocket disconnected');
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Start server
async function startServer() {
  try {
    // Connect to database (optional for development)
    const dbService = DatabaseService.getInstance();
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.warn('⚠️ MONGO_URI not set in environment variables');
    }
    
    try {
      await dbService.connect(mongoUri);
      await dbService.createIndexes();
      console.log('✅ Database connected successfully');
    } catch (dbError) {
      console.warn('⚠️ Database connection failed, running without database:', dbError.message);
      console.log('💡 To use database features, please:');
      console.log('   1. Install MongoDB locally, or');
      console.log('   2. Set MONGO_URI environment variable to MongoDB Atlas connection string');
    }

    // Start HTTP server with WebSocket
    server.listen(PORT, () => {
      console.log(`🚀 SOMIX API server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
      console.log(`🔌 WebSocket server ready for notifications`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  const dbService = DatabaseService.getInstance();
  await dbService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  const dbService = DatabaseService.getInstance();
  await dbService.disconnect();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();

