import api from './api.js'

export const postsService = {
  // Create a new post
  createPost: async (data) => {
    try {
      const response = await api.post('/posts', data)
      return response.data
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create post'
      }
    }
  },

  // Get posts with pagination
  getPosts: async (page = 1, pageSize = 20) => {
    try {
      const response = await api.get('/posts', {
        params: { page, pageSize }
      })
      return response.data
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch posts'
      }
    }
  },

  // Get a single post by ID
  getPost: async (postId) => {
    try {
      const response = await api.get(`/posts/${postId}`)
      return response.data
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch post'
      }
    }
  },

  // Get posts by user address
  getUserPosts: async (address, page = 1, pageSize = 20) => {
    try {
      const response = await api.get(`/profile/${address}/posts`, {
        params: { page, pageSize }
      })
      return response.data
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch user posts'
      }
    }
  }
}


