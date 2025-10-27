import axios from 'axios'

// Default to Railway backend in production
const API_BASE_URL = import.meta.env.VITE_API_BASE || 
  (import.meta.env.PROD ? 'https://somix-production.up.railway.app/api' : 'http://localhost:3001/api')

const ipfsService = {
  async uploadFromUrl(imageUrl) {
    try {
      const response = await axios.post(`${API_BASE_URL}/ipfs/upload-from-url`, {
        url: imageUrl
      })
      
      return {
        success: true,
        cid: response.data.cid,
        gatewayUrl: response.data.gatewayUrl,
        thumbUrl: response.data.thumbUrl,
        blurHash: response.data.blurHash
      }
    } catch (error) {
      console.error('IPFS upload error:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to upload to IPFS'
      }
    }
  },

  async uploadFile(file) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await axios.post(`${API_BASE_URL}/ipfs/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      return {
        success: true,
        cid: response.data.cid,
        gatewayUrl: response.data.gatewayUrl,
        thumbUrl: response.data.thumbUrl,
        blurHash: response.data.blurHash
      }
    } catch (error) {
      console.error('IPFS file upload error:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to upload file to IPFS'
      }
    }
  }
}

export { ipfsService }
