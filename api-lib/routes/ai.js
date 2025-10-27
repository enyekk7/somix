const express = require('express');
const DeepAIService = require('../services/deepai');

const router = express.Router();
const deepAI = new DeepAIService(process.env.DEEPAI_KEY || '');

// Rate limiting for AI generation
const rateLimit = require('express-rate-limit');
const aiGenerateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute per IP
  message: {
    error: 'Too many AI generation requests',
    message: 'Please wait before generating another image'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/ai/generate
router.post('/generate', aiGenerateLimiter, async (req, res) => {
  try {
    const { prompt } = req.body;

    // Validate input
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required and must be a string'
      });
    }

    if (prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Prompt cannot be empty'
      });
    }

    if (prompt.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Prompt must be 500 characters or less'
      });
    }

    // Generate image
    try {
      const imageUrl = await deepAI.generateImage(prompt.trim());
      
      res.json({
        success: true,
        imageUrl
      });
    } catch (generationError) {
      console.error('Image generation failed:', generationError);
      
      // If generation fails, return a mock image URL
      const mockImageUrl = `https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=600&h=600&fit=crop&q=${Date.now()}`;
      
      res.json({
        success: true,
        imageUrl: mockImageUrl,
        note: 'Using fallback image due to generation error'
      });
    }

  } catch (error) {
    console.error('AI generation error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate image';
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// GET /api/ai/validate
router.get('/validate', async (req, res) => {
  try {
    const isValid = await deepAI.validateApiKey();
    
    res.json({
      success: true,
      valid: isValid
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to validate API key'
    });
  }
});

module.exports = router;


