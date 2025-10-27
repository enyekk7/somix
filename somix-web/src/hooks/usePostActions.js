import { useCallback } from 'react';
import { useAccount } from 'wagmi';

// Default to Railway backend in production
const API_BASE = import.meta.env.VITE_API_BASE || 
  (import.meta.env.PROD ? 'https://somix-production.up.railway.app/api' : 'http://localhost:3001/api');

export function usePostActions() {
  const { address } = useAccount();

  // Function to call backend for liking a post
  const likePost = useCallback(async (postId) => {
    if (!address) {
      alert('Please connect your wallet to like posts.');
      return { success: false, error: 'Wallet not connected' };
    }
    
    // Validate postId
    if (!postId) {
      console.error('Post ID is required');
      return { success: false, error: 'Post ID is required' };
    }
    
    try {
      const response = await fetch(`${API_BASE}/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userAddress: address })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Like API error:', errorData);
        return { success: false, error: errorData.error || `HTTP error! status: ${response.status}` };
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Failed to like post:', err);
      return { success: false, error: 'Network error' };
    }
  }, [address]);

  // Function to call backend for unliking a post
  const unlikePost = useCallback(async (postId) => {
    if (!address) {
      alert('Please connect your wallet to unlike posts.');
      return { success: false, error: 'Wallet not connected' };
    }
    
    // Validate postId
    if (!postId) {
      console.error('Post ID is required');
      return { success: false, error: 'Post ID is required' };
    }
    
    try {
      const response = await fetch(`${API_BASE}/posts/${postId}/unlike`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userAddress: address })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Unlike API error:', errorData);
        return { success: false, error: errorData.error || `HTTP error! status: ${response.status}` };
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Failed to unlike post:', err);
      return { success: false, error: 'Network error' };
    }
  }, [address]);

  // Function to check if user has liked a post
  const checkLikeStatus = useCallback(async (postId) => {
    if (!address) {
      return { success: false, hasLiked: false };
    }
    try {
      const response = await fetch(`${API_BASE}/posts/${postId}/like-status?userAddress=${address}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Failed to check like status:', err);
      // Return default values instead of throwing
      return { success: false, hasLiked: false };
    }
  }, [address]);

  // Function to call backend for following a user
  const followUser = useCallback(async (userAddress) => {
    if (!address) {
      alert('Please connect your wallet to follow users.');
      return false;
    }
    try {
      const response = await fetch(`${API_BASE}/users/${userAddress}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ followerAddress: address })
      });
      const data = await response.json();
      return data.success;
    } catch (err) {
      console.error('Failed to follow user:', err);
      alert('Failed to follow user.');
      return false;
    }
  }, [address]);

  return {
    likePost,
    unlikePost,
    checkLikeStatus,
    followUser
  };
}
