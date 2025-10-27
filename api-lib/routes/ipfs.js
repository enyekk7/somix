const express = require('express');
const PinataService = require('../services/pinata');

const router = express.Router();
const pinata = new PinataService(
  process.env.PINATA_JWT || '',
  process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud'
);

// POST /api/ipfs/upload-from-url
router.post('/upload-from-url', async (req, res) => {
  try {
    const { url, metadata } = req.body;

    // Validate input
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'URL is required and must be a string'
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
    }

    // Upload to IPFS
    try {
      const result = await pinata.uploadFromUrl(url, metadata);

      res.json({
        success: true,
        cid: result.cid,
        gatewayUrl: result.gatewayUrl,
        thumbUrl: result.thumbUrl,
        blurHash: result.blurHash
      });
    } catch (ipfsError) {
      console.error('IPFS upload failed, using fallback:', ipfsError.message);
      
      // Fallback: return the original URL with default values
      res.json({
        success: true,
        cid: 'fallback',
        gatewayUrl: url,
        thumbUrl: url,
        blurHash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj', // Default blur hash
        note: 'IPFS upload failed, using direct URL'
      });
    }

  } catch (error) {
    console.error('IPFS upload error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload to IPFS';
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// POST /api/ipfs/upload-metadata
router.post('/upload-metadata', async (req, res) => {
  try {
    const { metadata } = req.body;

    if (!metadata || typeof metadata !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Metadata is required and must be an object'
      });
    }

    if (!metadata.name || typeof metadata.name !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Metadata name is required and must be a string'
      });
    }

    const metadataUrl = await pinata.uploadMetadata(metadata);

    res.json({
      success: true,
      metadataUrl
    });

  } catch (error) {
    console.error('Metadata upload error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload metadata';
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// GET /api/ipfs/validate
router.get('/validate', async (req, res) => {
  try {
    const isValid = await pinata.validateJWT();
    
    res.json({
      success: true,
      valid: isValid
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to validate Pinata JWT'
    });
  }
});

module.exports = router;


