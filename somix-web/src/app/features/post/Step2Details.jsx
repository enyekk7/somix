import { useState } from 'react'
import { Tag, Eye, EyeOff, Coins, Hash, MessageCircle } from 'lucide-react'
import { useDraftStore } from '../../state/useDraft.js'
import { Button } from '../../components/Button.jsx'

export function Step2Details() {
  const { draft, setCaption, setTags, setVisibility, setAllowComments, setOpenMint, setEditionsCap } = useDraftStore()
  const [tagInput, setTagInput] = useState('')

  const handleAddTag = () => {
    if (tagInput.trim() && !draft.tags.includes(tagInput.trim()) && draft.tags.length < 10) {
      setTags([...draft.tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (index) => {
    setTags(draft.tags.filter((_, i) => i !== index))
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  return (
    <div className="space-y-6">
      {/* Image Preview */}
      {draft.imageData && (
        <div className="aspect-square bg-gray-800 rounded-xl overflow-hidden">
          <img
            src={draft.imageData.thumbUrl}
            alt="Generated artwork"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Caption */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Caption *
        </label>
        <textarea
          value={draft.caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Tell the story behind your AI artwork..."
          className="input-field h-24 resize-none"
          maxLength={500}
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-500">
            {draft.caption.length}/500 characters
          </span>
          {!draft.caption.trim() && (
            <span className="text-xs text-red-400">Caption is required</span>
          )}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Tags (optional)
        </label>
        <div className="flex space-x-2 mb-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a tag..."
              className="input-field pr-10"
              maxLength={50}
            />
            <Hash className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>
          <Button
            onClick={handleAddTag}
            disabled={!tagInput.trim() || draft.tags.includes(tagInput.trim()) || draft.tags.length >= 10}
            size="sm"
            variant="outline"
          >
            <Tag size={16} />
          </Button>
        </div>
        
        {draft.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {draft.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full"
              >
                #{tag}
                <button
                  onClick={() => handleRemoveTag(index)}
                  className="ml-2 text-purple-400 hover:text-purple-200"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        
        <p className="text-xs text-gray-500 mt-1">
          {draft.tags.length}/10 tags • Press Enter to add
        </p>
      </div>

      {/* Visibility Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-300">Post Settings</h3>
        
        {/* Visibility */}
        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-3">
            {draft.visibility === 'public' ? (
              <Eye size={20} className="text-green-400" />
            ) : (
              <EyeOff size={20} className="text-gray-400" />
            )}
            <div>
              <div className="text-sm font-medium text-white">
                {draft.visibility === 'public' ? 'Public' : 'Followers Only'}
              </div>
              <div className="text-xs text-gray-400">
                {draft.visibility === 'public' 
                  ? 'Anyone can see this post' 
                  : 'Only your followers can see this post'
                }
              </div>
            </div>
          </div>
          <Button
            onClick={() => setVisibility(draft.visibility === 'public' ? 'followers' : 'public')}
            variant="ghost"
            size="sm"
          >
            {draft.visibility === 'public' ? 'Make Private' : 'Make Public'}
          </Button>
        </div>

        {/* Comments */}
        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-3">
            <MessageCircle size={20} className={draft.allowComments ? "text-blue-400" : "text-gray-400"} />
            <div>
              <div className="text-sm font-medium text-white">
                Allow Comments
              </div>
              <div className="text-xs text-gray-400">
                {draft.allowComments ? 'Users can comment on this post' : 'Comments are disabled'}
              </div>
            </div>
          </div>
          <Button
            onClick={() => setAllowComments(!draft.allowComments)}
            variant="ghost"
            size="sm"
          >
            {draft.allowComments ? 'Disable' : 'Enable'}
          </Button>
        </div>
      </div>

      {/* NFT Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-300">NFT Settings</h3>
        
        {/* Open Mint Toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-3">
            <Coins size={20} className={draft.openMint ? "text-yellow-400" : "text-gray-400"} />
            <div>
              <div className="text-sm font-medium text-white">
                Open Mint
              </div>
              <div className="text-xs text-gray-400">
                {draft.openMint 
                  ? 'Others can mint NFTs from this post' 
                  : 'Only you can mint NFTs from this post'
                }
              </div>
            </div>
          </div>
          <Button
            onClick={() => setOpenMint(!draft.openMint)}
            variant="ghost"
            size="sm"
          >
            {draft.openMint ? 'Disable' : 'Enable'}
          </Button>
        </div>

        {/* Edition Cap */}
        {draft.openMint && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Edition Cap (optional)
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={draft.editionsCap || ''}
                onChange={(e) => setEditionsCap(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="e.g., 100"
                min="1"
                max="10000"
                className="input-field flex-1"
              />
              <Button
                onClick={() => setEditionsCap(null)}
                variant="outline"
                size="sm"
              >
                Unlimited
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Leave empty for unlimited editions
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
        <h3 className="text-sm font-medium text-purple-300 mb-2">📋 Post Summary</h3>
        <div className="text-xs text-gray-400 space-y-1">
          <div>• Visibility: {draft.visibility === 'public' ? 'Public' : 'Followers Only'}</div>
          <div>• Comments: {draft.allowComments ? 'Enabled' : 'Disabled'}</div>
          <div>• Open Mint: {draft.openMint ? 'Yes' : 'No'}</div>
          {draft.openMint && draft.editionsCap && (
            <div>• Edition Cap: {draft.editionsCap}</div>
          )}
          <div>• Tags: {draft.tags.length}</div>
        </div>
      </div>
    </div>
  )
}


