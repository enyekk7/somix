import React, { useState } from 'react';
import { X, User, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { useWallet } from '../hooks/useWallet';
import api from '../services/api';

const EditUsernameModal = ({ isOpen, onClose, currentUsername, onUsernameUpdated }) => {
  const { address } = useWallet();
  const [newUsername, setNewUsername] = useState(currentUsername || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newUsername.trim()) {
      setError('Username is required');
      return;
    }

    if (newUsername === currentUsername) {
      setError('Please enter a different username');
      return;
    }

    if (!address) {
      setError('Wallet not connected');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.put(`/users/${address}/username`, {
        username: newUsername.trim()
      });

      if (response.data.success) {
        setSuccess(`Username updated successfully! Updated ${response.data.postsUpdated} posts.`);
        
        // Call callback to update parent component
        if (onUsernameUpdated) {
          onUsernameUpdated(response.data.user);
        }

        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(response.data.error || 'Failed to update username');
      }
    } catch (error) {
      console.error('Update username error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update username';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNewUsername(currentUsername || '');
    setError('');
    setSuccess('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="glass-effect rounded-3xl p-8 w-full max-w-md text-center shadow-2xl bg-purple-900/20 border border-purple-500">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Edit Username</h2>
          <p className="text-gray-300">Update your username across all posts</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Username */}
          <div className="text-left">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Current Username
            </label>
            <div className="bg-white/5 rounded-xl p-3 text-gray-400">
              {currentUsername || 'No username set'}
            </div>
          </div>

          {/* New Username */}
          <div className="text-left">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              New Username
            </label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              placeholder="Enter new username"
              maxLength={30}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-400 mt-1">
              3-30 characters, letters, numbers, and underscores only
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-xl p-4 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-300 text-sm">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-900/20 border border-green-500 rounded-xl p-4 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-300 text-sm">{success}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex space-x-3">
            <Button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition-all"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-xl transition-all"
              disabled={isLoading || !newUsername.trim() || newUsername === currentUsername}
            >
              {isLoading ? 'Updating...' : 'Update Username'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUsernameModal;
