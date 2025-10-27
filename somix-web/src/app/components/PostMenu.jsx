import { useState } from 'react'
import { MoreVertical, Trash2, AlertTriangle, Flag } from 'lucide-react'
import { clsx } from 'clsx'
import { Button } from './Button.jsx'

export function PostMenu({ post, onDeletePost, isOwnPost }) {
  const [isOpen, setIsOpen] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isReporting, setIsReporting] = useState(false)

  const handleDeleteClick = () => {
    setIsOpen(false)
    setShowDeleteModal(true)
  }

  const handleReportClick = () => {
    setIsOpen(false)
    setShowReportModal(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      await onDeletePost(post._id)
      setShowDeleteModal(false)
    } catch (error) {
      console.error('Failed to delete post:', error)
      alert('Failed to delete post. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
  }

  const handleConfirmReport = async () => {
    setIsReporting(true)
    try {
      // TODO: Implement report functionality
      console.log('Reporting post:', post._id)
      alert('Post reported successfully! Thank you for helping keep our community safe.')
      setShowReportModal(false)
    } catch (error) {
      console.error('Failed to report post:', error)
      alert('Failed to report post. Please try again.')
    } finally {
      setIsReporting(false)
    }
  }

  const handleCancelReport = () => {
    setShowReportModal(false)
  }

  // Debug logging
  console.log('PostMenu - isOwnPost:', isOwnPost, 'post.authorAddress:', post.authorAddress)
  
  // Show menu for all posts (both own and others)
  // No longer hiding menu based on ownership

  return (
    <>
      {/* Three Dots Menu */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-all duration-200 border border-gray-600 bg-gray-800/50"
          title="Post options"
        >
          <MoreVertical size={18} className="text-white" />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            <div className="absolute right-0 top-8 z-20 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl py-2 min-w-[160px]">
              {isOwnPost ? (
                // Delete option for own posts
                <button
                  onClick={handleDeleteClick}
                  className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center space-x-3"
                >
                  <Trash2 size={16} />
                  <span className="text-sm font-medium">Delete Post</span>
                </button>
              ) : (
                // Report option for others' posts
                <button
                  onClick={handleReportClick}
                  className="w-full px-4 py-3 text-left text-orange-400 hover:bg-orange-500/10 hover:text-orange-300 transition-colors flex items-center space-x-3"
                >
                  <Flag size={16} />
                  <span className="text-sm font-medium">Report Post</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-500/20 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete Post</h3>
                <p className="text-gray-400 text-sm">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this post? It will be permanently removed from the database and will no longer be visible to anyone.
            </p>
            
            <div className="flex space-x-3">
              <Button
                onClick={handleCancelDelete}
                variant="outline"
                className="flex-1"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Report Confirmation Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-orange-500/20 rounded-full">
                <Flag className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Report Post</h3>
                <p className="text-gray-400 text-sm">Help us keep the community safe</p>
              </div>
            </div>
            
            <p className="text-gray-300 mb-6">
              Are you sure you want to report this post? Our moderation team will review it and take appropriate action if it violates our community guidelines.
            </p>
            
            <div className="flex space-x-3">
              <Button
                onClick={handleCancelReport}
                variant="outline"
                className="flex-1"
                disabled={isReporting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmReport}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                disabled={isReporting}
              >
                {isReporting ? 'Reporting...' : 'Report'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
