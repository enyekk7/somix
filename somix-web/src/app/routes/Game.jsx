import { Trophy, Crown, Star, TrendingUp, Users, Image, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../services/api.js'

export function Game() {
  const navigate = useNavigate()
  const [topCreators, setTopCreators] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTopCreators()
  }, [])

  const fetchTopCreators = async () => {
    try {
      setLoading(true)
      const response = await api.get('/users/top-creators')
      if (response.data.success) {
        setTopCreators(response.data.creators)
        console.log('✅ Top creators loaded:', response.data.creators.length)
      }
    } catch (error) {
      console.error('❌ Error fetching top creators:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-green-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center animate-pulse">
              <Trophy className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold gradient-text mb-4">Top Creators</h1>
          <p className="text-xl text-gray-400">Most influential creators on Somix</p>
          <p className="text-sm text-gray-500 mt-2">Ranked by posts, mints, and followers</p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading top creators...</p>
          </div>
        ) : (
          /* Top Creators List */
          <div className="space-y-4">
            {topCreators.map((creator, index) => (
              <div key={creator._id} className="glass-effect rounded-3xl p-6 hover:scale-[1.02] transition-all">
                <div className="flex items-center space-x-4">
                  {/* Rank */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white' :
                    index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white' :
                    index === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    #{creator.rank}
                  </div>

                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                    {creator.avatarUrl ? (
                      <img src={creator.avatarUrl} alt={creator.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-2xl font-bold">{creator.username[0]?.toUpperCase() || 'U'}</span>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-xl font-bold text-white truncate">{creator.username}</h3>
                      {creator.isVerified && <Crown className="w-5 h-5 text-yellow-400 flex-shrink-0" />}
                      {creator.isSomixPro && <Star className="w-5 h-5 text-purple-400 flex-shrink-0" />}
                    </div>
                    <p className="text-gray-400 text-sm truncate">{creator.bio || 'No bio yet'}</p>
                    <p className="text-gray-500 text-xs mt-1">{creator.address.slice(0, 10)}...{creator.address.slice(-8)}</p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Image className="w-4 h-4 text-blue-400" />
                        <span className="text-lg font-bold text-white">{creator.postCount}</span>
                      </div>
                      <p className="text-xs text-gray-400">Posts</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Zap className="w-4 h-4 text-purple-400" />
                        <span className="text-lg font-bold text-white">{creator.mintCount}</span>
                      </div>
                      <p className="text-xs text-gray-400">Mints</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Users className="w-4 h-4 text-green-400" />
                        <span className="text-lg font-bold text-white">{creator.followerCount}</span>
                      </div>
                      <p className="text-xs text-gray-400">Followers</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span className="text-lg font-bold text-white">{Math.round(creator.totalScore)}</span>
                      </div>
                      <p className="text-xs text-gray-400">Score</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back Button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}
