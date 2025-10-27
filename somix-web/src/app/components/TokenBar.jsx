import { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { Coins, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { clsx } from 'clsx'
import api from '../services/api.js'

export const TokenBar = forwardRef((props, ref) => {
  const navigate = useNavigate()
  const { address, isConnected } = useAccount()
  const [tokens, setTokens] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Expose refresh method to parent component
  useImperativeHandle(ref, () => ({
    refreshTokens: fetchTokens
  }))

  useEffect(() => {
    if (isConnected && address) {
      fetchTokens()
    }
  }, [address, isConnected])

  const fetchTokens = async () => {
    try {
      setIsLoading(true)
      const response = await api.get(`/tokens/${address}`)
      if (response.data.success) {
        setTokens(response.data.tokens)
      }
    } catch (error) {
      console.error('Failed to fetch tokens:', error)
      setTokens(0) // Default tokens
    } finally {
      setIsLoading(false)
    }
  }

  const getTokenColor = () => {
    if (tokens >= 40) return 'text-green-400 border-green-400/50'
    if (tokens >= 20) return 'text-yellow-400 border-yellow-400/50'
    return 'text-red-400 border-red-400/50'
  }

  return (
    <div className="glass-effect rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-400/30">
            <Coins className="w-6 h-6 text-purple-400" />
          </div>
          
          {/* Token Display - Simple Box Design */}
          <div className={clsx(
            "px-6 py-3 rounded-xl border-2 transition-all duration-300",
            getTokenColor()
          )}>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-400 font-medium">My Tokens:</span>
              {isLoading ? (
                <div className="w-16 h-6 bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <span className="text-2xl font-bold tracking-wide">
                  {tokens}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <button
          onClick={() => navigate('/topup')}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 flex items-center space-x-2 shadow-lg shadow-purple-500/30"
        >
          <Plus className="w-4 h-4" />
          <span>Top Up</span>
        </button>
      </div>
      
      {tokens < 20 && (
        <div className="mt-3 p-3 bg-red-500/20 border border-red-500/50 rounded-xl animate-pulse">
          <p className="text-red-400 text-sm text-center font-medium">
            ⚠️ You need at least 20 tokens to generate an image. Top up now!
          </p>
        </div>
      )}
    </div>
  )
})
