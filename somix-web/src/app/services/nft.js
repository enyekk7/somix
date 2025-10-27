import api from './api.js'

export const nftService = {
  // Prepare metadata for NFT minting
  prepareMetadata: async (postId) => {
    try {
      const response = await api.post('/mints/prepare-metadata-for-post', {
        postId
      })
      return response.data
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to prepare metadata'
      }
    }
  },

  // Record a successful mint
  recordMint: async (data) => {
    try {
      const response = await api.post('/mints/record', data)
      return response.data
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to record mint'
      }
    }
  },

  // Get mints for a specific post
  getPostMints: async (postId, page = 1, pageSize = 20) => {
    try {
      const response = await api.get(`/mints/post/${postId}`, {
        params: { page, pageSize }
      })
      return response.data
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch mints'
      }
    }
  },

  // Get mints by user address
  getUserMints: async (address, page = 1, pageSize = 20) => {
    try {
      const response = await api.get(`/mints/user/${address}`, {
        params: { page, pageSize }
      })
      return response.data
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch user mints'
      }
    }
  }
}


