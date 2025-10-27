import { useState } from 'react'
import { Sparkles, RefreshCw, Check } from 'lucide-react'
import { useDraftStore } from '../../state/useDraft.js'
import { aiService } from '../../services/ai.js'
import { Button } from '../../components/Button.jsx'
import { Spinner } from '../../components/Spinner.jsx'

export function Step1Generate() {
  const { draft, setPrompt, setImageUrl, setImageData } = useDraftStore()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState(null)

  const handleGenerate = async () => {
    if (!draft.prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const result = await aiService.generateImage(draft.prompt.trim())
      
      if (result.success && result.imageUrl) {
        setImageUrl(result.imageUrl)
        
        // Automatically upload to IPFS
        setIsUploading(true)
        const uploadResult = await aiService.uploadToIPFS({
          url: result.imageUrl,
          metadata: {
            name: `SOMIX AI Art - ${draft.prompt.slice(0, 50)}`,
            description: `AI-generated artwork created with prompt: ${draft.prompt}`,
            attributes: [
              { trait_type: 'AI Prompt', value: draft.prompt },
              { trait_type: 'Platform', value: 'SOMIX' },
              { trait_type: 'Generated', value: new Date().toISOString() }
            ]
          }
        })

        if (uploadResult.success && uploadResult.cid) {
          setImageData({
            cid: uploadResult.cid,
            url: uploadResult.gatewayUrl,
            thumbUrl: uploadResult.thumbUrl,
            blurHash: uploadResult.blurHash
          })
        } else {
          setError(uploadResult.error || 'Failed to upload to IPFS')
        }
      } else {
        setError(result.error || 'Failed to generate image')
      }
    } catch (error) {
      console.error('Generation error:', error)
      setError('Failed to generate image')
    } finally {
      setIsGenerating(false)
      setIsUploading(false)
    }
  }

  const handleRegenerate = () => {
    setImageUrl('')
    setImageData(undefined)
    handleGenerate()
  }

  return (
    <div className="space-y-6">
      {/* Prompt Input */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Describe your AI artwork
        </label>
        <textarea
          value={draft.prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="A majestic elephant running through a snowy field under the northern lights..."
          className="input-field h-32 resize-none"
          maxLength={500}
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-500">
            {draft.prompt.length}/500 characters
          </span>
          {error && (
            <span className="text-xs text-red-400">{error}</span>
          )}
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex justify-center">
        {!draft.imageUrl ? (
          <Button
            onClick={handleGenerate}
            disabled={!draft.prompt.trim() || isGenerating}
            loading={isGenerating}
            size="lg"
            className="px-8 py-4"
          >
            <Sparkles size={20} className="mr-2" />
            Generate AI Art
          </Button>
        ) : (
          <Button
            onClick={handleRegenerate}
            disabled={isGenerating}
            loading={isGenerating}
            variant="outline"
            size="lg"
            className="px-8 py-4"
          >
            <RefreshCw size={20} className="mr-2" />
            Regenerate
          </Button>
        )}
      </div>

      {/* Image Preview */}
      {draft.imageUrl && (
        <div className="relative">
          <div className="aspect-square bg-gray-800 rounded-xl overflow-hidden">
            {isUploading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <Spinner size="lg" className="mb-4" />
                  <p className="text-gray-400">Uploading to IPFS...</p>
                </div>
              </div>
            ) : draft.imageData ? (
              <div className="relative">
                <img
                  src={draft.imageData.thumbUrl}
                  alt="Generated artwork"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <Check size={16} className="mr-1" />
                  Ready
                </div>
              </div>
            ) : (
              <img
                src={draft.imageUrl}
                alt="Generated artwork"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          
          {draft.imageData && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
              <h3 className="text-sm font-medium text-gray-300 mb-2">IPFS Details</h3>
              <div className="space-y-1 text-xs text-gray-400">
                <div>CID: {draft.imageData.cid}</div>
                <div>Gateway: {draft.imageData.gatewayUrl}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
        <h3 className="text-sm font-medium text-purple-300 mb-2">💡 Tips for better results</h3>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Be specific about style, colors, and mood</li>
          <li>• Include artistic techniques (oil painting, digital art, etc.)</li>
          <li>• Mention lighting and atmosphere</li>
          <li>• Keep prompts under 200 words for best results</li>
        </ul>
      </div>
    </div>
  )
}


