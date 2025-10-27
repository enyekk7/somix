import api from './api.js';

export const searchService = {
  // Search posts
  async searchPosts(query, page = 1, pageSize = 20) {
    try {
      const response = await api.get('/search', {
        params: {
          q: query,
          page,
          pageSize
        }
      });
      return response.data;
    } catch (error) {
      console.error('Search posts error:', error);
      throw error;
    }
  },

  // Search users
  async searchUsers(query, page = 1, pageSize = 20) {
    try {
      const response = await api.get('/search/users', {
        params: {
          q: query,
          page,
          pageSize
        }
      });
      return response.data;
    } catch (error) {
      console.error('Search users error:', error);
      throw error;
    }
  },

  // Search tags
  async searchTags(query) {
    try {
      const response = await api.get('/search/tags', {
        params: {
          q: query
        }
      });
      return response.data;
    } catch (error) {
      console.error('Search tags error:', error);
      throw error;
    }
  },

  // Combined search (posts + users + tags)
  async searchAll(query, page = 1, pageSize = 20) {
    try {
      const [postsResult, usersResult, tagsResult] = await Promise.allSettled([
        this.searchPosts(query, page, pageSize),
        this.searchUsers(query, page, pageSize),
        this.searchTags(query)
      ]);

      return {
        success: true,
        posts: postsResult.status === 'fulfilled' ? postsResult.value : { success: false, results: [] },
        users: usersResult.status === 'fulfilled' ? usersResult.value : { success: false, users: [] },
        tags: tagsResult.status === 'fulfilled' ? tagsResult.value : { success: false, tags: [] }
      };
    } catch (error) {
      console.error('Combined search error:', error);
      throw error;
    }
  }
};
