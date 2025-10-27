import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { Heart, MessageCircle, Coins, ExternalLink, Sparkles, Zap, Users, TrendingUp, Wallet, Menu, X, Bot, Award, Target, Check, Crown } from 'lucide-react'
import { clsx } from 'clsx'
import { postsService } from '../services/posts.js'
import { Avatar } from '../components/Avatar.jsx'
import { Button } from '../components/Button.jsx'
import { Spinner } from '../components/Spinner.jsx'
import { MintButton } from '../components/MintButton.jsx'
import { PostMenu } from '../components/PostMenu.jsx'
import { usePostActions } from '../../hooks/usePostActions.js'
import { WalletConnect } from '../components/WalletConnect.jsx'
import api from '../services/api.js'

export function Home() {
  const [page, setPage] = useState(1)
  const [posts, setPosts] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)
  const { address, isConnected } = useAccount()
  const navigate = useNavigate()

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useQuery({
    queryKey: ['posts', page],
    queryFn: () => postsService.getPosts(page, 20),
    keepPreviousData: true,
  })

  useEffect(() => {
    if (data?.success && data.posts) {
      if (page === 1) {
        setPosts(data.posts)
      } else {
        setPosts(prev => [...prev, ...data.posts])
      }
    }
  }, [data, page])

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      setPage(prev => prev + 1)
    }
  }

  const handleMintSuccess = (txHash, postId) => {
    // Update the specific post's mint count without refreshing the page
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post._id === postId 
          ? { 
              ...post, 
              editions: {
                ...post.editions,
                minted: (post.editions?.minted || 0) + 1
              }
            }
          : post
      )
    )
    
    // Show success message
    console.log('✅ Mint successful! Transaction:', txHash)
    console.log('📊 Post mint count updated without page refresh')
  }

  const handleDeletePost = async (postId) => {
    try {
      const response = await api.delete(`/posts/${postId}`, {
        data: { authorAddress: address }
      })
      
      if (response.data.success) {
        // Remove post from local state
        setPosts(prev => prev.filter(post => post._id !== postId))
        console.log('Post deleted successfully')
      } else {
        throw new Error(response.data.error || 'Failed to delete post')
      }
    } catch (error) {
      console.error('Delete post error:', error)
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 left-40 w-60 h-60 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="relative z-50 p-2 rounded-xl hover:bg-white/10 transition-colors duration-200"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </button>

          <div className="flex items-center space-x-3">
            {isConnected ? (
              <div className="flex items-center space-x-2 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Connected</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-gray-400">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm font-medium">Not Connected</span>
              </div>
            )}
            <WalletConnect />
          </div>
        </div>
      </div>

      {/* Slide-out Menu */}
      <div
        className={clsx(
          "fixed inset-0 z-40 transition-all duration-300 ease-in-out",
          menuOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        onClick={() => setMenuOpen(false)}
      >
        {/* Overlay */}
        <div
          className={clsx(
            "absolute inset-0 bg-black transition-opacity duration-300",
            menuOpen ? "opacity-70" : "opacity-0"
          )}
        />
        
        {/* Menu Panel */}
        <div
          className={clsx(
            "absolute left-0 top-0 bottom-0 w-80 bg-gradient-to-br from-gray-900 via-black to-purple-900 border-r border-white/10 backdrop-blur-xl shadow-2xl transition-transform duration-300 ease-in-out",
            menuOpen ? "translate-x-0" : "-translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full">
            {/* Menu Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold gradient-text">SOMIX</h2>
              </div>
              <p className="text-gray-400 text-sm">Welcome to your creative hub</p>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 overflow-y-auto py-4">
              <div className="px-4 space-y-2">
                {/* Agent */}
                <button
                  onClick={() => {
                    navigate('/agent')
                    setMenuOpen(false)
                  }}
                  className="w-full group flex items-center space-x-4 px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-200"
                >
                  <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                    <Bot className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-white">Agent</div>
                    <div className="text-xs text-gray-400">AI-powered assistant</div>
                  </div>
                </button>

                {/* Top Creators */}
                <button
                  onClick={() => {
                    navigate('/topcreators')
                    setMenuOpen(false)
                  }}
                  className="w-full group flex items-center space-x-4 px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-200"
                >
                  <div className="p-2 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                    <Award className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-white">Top Creators</div>
                    <div className="text-xs text-gray-400">Most influential creators</div>
                  </div>
                </button>

                {/* SomixPro */}
                <button
                  onClick={() => {
                    navigate('/somixpro')
                    setMenuOpen(false)
                  }}
                  className="w-full group flex items-center space-x-4 px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-200"
                >
                  <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                    <Award className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-white">SomixPro</div>
                    <div className="text-xs text-gray-400">Premium features</div>
                  </div>
                </button>

                {/* Mission */}
                <button
                  onClick={() => {
                    navigate('/mission')
                    setMenuOpen(false)
                  }}
                  className="w-full group flex items-center space-x-4 px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-200"
                >
                  <div className="p-2 rounded-lg bg-yellow-500/20 group-hover:bg-yellow-500/30 transition-colors">
                    <Target className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-white">Mission</div>
                    <div className="text-xs text-gray-400">Complete missions</div>
                  </div>
                </button>
              </div>
            </nav>

            {/* Menu Footer */}
            <div className="p-6 border-t border-white/10">
              <div className="text-center text-xs text-gray-500">
                <p>Built with ❤️ on Somnia</p>
                <p className="mt-1">Version 1.0.0</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Spinner size="lg" />
            <p className="text-gray-400 mt-4">Loading posts...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Zap className="w-16 h-16 mb-4 text-purple-500" />
                <h2 className="text-2xl font-bold mb-2">No Posts Yet</h2>
                <p className="text-lg mb-6">Be the first to create an AI masterpiece!</p>
                <div className="space-y-4">
                  {isConnected ? (
                    <Button 
                      onClick={() => navigate('/post')}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-4 rounded-2xl transition-all duration-300 shadow-2xl text-lg"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Create Your First Post
                    </Button>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="flex items-center justify-center space-x-2 text-gray-500 mb-4">
                        <Wallet className="w-5 h-5" />
                        <span>Connect wallet to create posts</span>
                      </div>
                      <WalletConnect />
                    </div>
                  )}
                  <p className="text-gray-500 text-sm">✨ Powered by AI • 🔗 Built on Somnia Testnet (STT)</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} onMintSuccess={handleMintSuccess} onDeletePost={handleDeletePost} address={address} />
                ))}
                {hasNextPage && (
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isFetchingNextPage ? 'Loading...' : 'Load More'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function PostCard({ post, onMintSuccess, onDeletePost, address }) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likeCount || 0)
  const [isLiking, setIsLiking] = useState(false)
  const navigate = useNavigate()
  const { likePost, unlikePost, checkLikeStatus } = usePostActions()

  // Debug: Log post author data
  useEffect(() => {
    if (post.author) {
      console.log('🔍 Post author data:', {
        username: post.author.username,
        isVerified: post.author.isVerified,
        isSomixPro: post.author.isSomixPro,
        address: post.author.address
      })
    }
  }, [post.author])

  // Check like status on component mount with debouncing
  useEffect(() => {
    let timeoutId;
    
    const checkStatus = async () => {
      try {
        const result = await checkLikeStatus(post._id)
        if (result.success) {
          setLiked(result.hasLiked)
        }
      } catch (error) {
        console.error('Error checking like status:', error)
        // Set default state on error
        setLiked(false)
      }
    }
    
    // Debounce the check to prevent multiple calls
    timeoutId = setTimeout(checkStatus, 100)
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [post._id, checkLikeStatus])

  const handleProfileClick = () => {
    // Use userId if available, otherwise fallback to address
    const profileId = post.author?.userId || post.author?.address || post.authorAddress
    console.log('Navigating to profile:', { profileId, post: post.author })
    navigate(`/profile/${profileId}`)
  }

  const handleLike = async () => {
    if (isLiking) return // Prevent multiple clicks
    
    console.log('🔄 Starting like/unlike process for post:', post._id)
    setIsLiking(true)
    
    if (liked) {
      // Unlike
      console.log('👎 Unliking post:', post._id)
      setLiked(false)
      setLikeCount(prev => Math.max(0, prev - 1))
      
      const result = await unlikePost(post._id)
      console.log('👎 Unlike result:', result)
      
      if (!result.success) {
        // Revert on failure
        setLiked(true)
        setLikeCount(prev => prev + 1)
        console.error('❌ Unlike failed:', result.error)
        alert(result.error || 'Failed to unlike post')
      } else {
        console.log('✅ Unlike successful')
      }
    } else {
      // Like
      console.log('👍 Liking post:', post._id)
      setLiked(true)
      setLikeCount(prev => prev + 1)
      
      const result = await likePost(post._id)
      console.log('👍 Like result:', result)
      
      if (!result.success) {
        // Revert on failure
        setLiked(false)
        setLikeCount(prev => Math.max(0, prev - 1))
        console.error('❌ Like failed:', result.error)
        alert(result.error || 'Failed to like post')
      } else {
        console.log('✅ Like successful')
      }
    }
    
    setIsLiking(false)
  }

  return (
    <div className="glass-effect rounded-3xl p-6 animate-fade-in hover:scale-[1.02] transition-all duration-300">
      {/* Author Info */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={handleProfileClick} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          {/* Avatar with SomixPro frame */}
          <div className="relative">
            {post.author?.isSomixPro && (
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 rounded-full animate-pulse blur-sm opacity-75"></div>
            )}
            <div className={clsx(
              "relative rounded-full p-0.5",
              post.author?.isSomixPro && "bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 animate-pulse"
            )}>
              <div className={clsx(
                "rounded-full overflow-hidden",
                post.author?.isSomixPro && "ring-2 ring-yellow-400/50"
              )}>
                <Avatar
                  src={post.author?.avatarUrl}
                  alt={post.author?.username || (post.author?.address ? `${post.author.address.slice(0, 6)}...${post.author.address.slice(-4)}` : 'Unknown')}
                  size="md"
                  isVerified={post.author?.isVerified || false}
                  isSomixPro={post.author?.isSomixPro || false}
                />
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-white hover:text-purple-400 transition-colors flex items-center space-x-1.5">
              <span>{post.author?.username || (post.author?.address ? `${post.author.address.slice(0, 6)}...${post.author.address.slice(-4)}` : 'Anonymous')}</span>
              {post.author?.isSomixPro && (
                <Crown className="w-4 h-4 text-yellow-400" />
              )}
            </h3>
            <p className="text-gray-400 text-sm">
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>
        </button>
        
        {/* Post Menu */}
        {(() => {
          const isOwnPost = address && post.authorAddress && address.toLowerCase() === post.authorAddress.toLowerCase()
          console.log('Home - address:', address, 'post.authorAddress:', post.authorAddress, 'isOwnPost:', isOwnPost)
          return (
            <PostMenu 
              post={post} 
              onDeletePost={onDeletePost}
              isOwnPost={isOwnPost}
            />
          )
        })()}
      </div>

      {/* Image */}
      <div className="relative w-full h-80 bg-gray-800 rounded-2xl overflow-hidden mb-4">
        {!imageLoaded && post.image?.blurHash && (
          <img
            src={`data:image/png;base64,${post.image.blurHash}`}
            alt="Loading"
            className="absolute inset-0 w-full h-full object-cover filter blur-lg"
          />
        )}
        <img
          src={post.image?.url || 'https://via.placeholder.com/600x400?text=No+Image'}
          alt={post.caption}
          className={clsx(
            "w-full h-full object-cover transition-opacity duration-500",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setImageLoaded(true)}
        />
      </div>

      {/* Caption */}
      <p className="text-gray-300 mb-3">{post.caption}</p>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-purple-800/50 text-purple-300 text-xs px-3 py-1 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-b border-gray-800 py-3">
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleLike}
            disabled={isLiking}
            className={clsx(
              "flex items-center space-x-2 transition-colors",
              liked ? "text-red-400" : "text-gray-400 hover:text-red-400",
              isLiking && "opacity-50 cursor-not-allowed"
            )}
          >
            <Heart size={20} fill={liked ? "currentColor" : "none"} />
            <span className="text-sm">{likeCount}</span>
            {isLiking && <span className="text-xs text-gray-500">...</span>}
          </button>
          
          <button className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors">
            <MessageCircle size={20} />
            <span className="text-sm">{post.commentCount || 0}</span>
          </button>
        </div>

        {/* Mint Button */}
        {post.openMint && (
          <MintButton 
            post={post} 
            onMintSuccess={(txHash) => onMintSuccess(txHash, post._id)} 
          />
        )}
      </div>

      {/* Edition Info */}
      {post.openMint && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
            <span>
              {post.editions?.cap ? `Edition: ${post.editions.minted}/${post.editions.cap}` : 'Open Edition'}
            </span>
            <button className="flex items-center space-x-1 text-purple-400 hover:text-purple-300">
              <ExternalLink size={14} />
              <span>View on Explorer</span>
            </button>
          </div>
          
          {/* Mint Progress Bar */}
          {post.editions?.cap && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Mint Progress</span>
                <span>{post.editions.minted}/{post.editions.cap}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
                  style={{ 
                    width: `${Math.min((post.editions.minted / post.editions.cap) * 100, 100)}%` 
                  }}
                />
              </div>
              <div className="text-xs text-gray-500 text-center">
                {post.editions.cap - post.editions.minted} remaining
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}