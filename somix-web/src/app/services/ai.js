import api from './api.js'

export const aiService = {
  // Generate image using DeepAI
  generateImage: async (prompt) => {
    try {
      const response = await api.post('/ai/generate', {
        prompt
      })
      return response.data
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to generate image'
      }
    }
  },

  // Upload image to IPFS
  uploadToIPFS: async (data) => {
    try {
      const response = await api.post('/ipfs/upload-from-url', data)
      return response.data
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to upload to IPFS'
      }
    }
  },

  // Validate AI service
  validateAI: async () => {
    try {
      const response = await api.get('/ai/validate')
      return response.data.valid
    } catch {
      return false
    }
  },

  // Validate IPFS service
  validateIPFS: async () => {
    try {
      const response = await api.get('/ipfs/validate')
      return response.data.valid
    } catch {
      return false
    }
  }
}


