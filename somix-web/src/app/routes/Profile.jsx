import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { User, Settings, Share2, Heart, MessageCircle, Coins, Calendar, Award, Star, Wallet, UserPlus, UserCheck, Check, Crown } from 'lucide-react'
import { Avatar } from '../components/Avatar.jsx'
import { clsx } from 'clsx'
import { Button } from '../components/Button.jsx'
import { useWallet } from '../hooks/useWallet.js'
import { Spinner } from '../components/Spinner.jsx'
import WithdrawModal from '../components/WithdrawModal.jsx'
import SuccessModal from '../components/SuccessModal.jsx'
import EditUsernameModal from '../components/EditUsernameModal.jsx'
import api from '../services/api.js'

export function Profile() {
  const { address: myAddress } = useWallet()
  const { address: urlAddress } = useParams()
  
  console.log('Profile render:', { myAddress, urlAddress })
  
  // Check if urlAddress is a number (userId) or address string
  const isUserId = urlAddress && !urlAddress.startsWith('0x')
  // Use urlAddress if available, otherwise use myAddress, but don't use 'undefined' string
  const profileId = urlAddress || (myAddress && myAddress !== 'undefined' ? myAddress : null)
  const isOwnProfile = !urlAddress || (myAddress && urlAddress === myAddress)
  
  console.log('Profile computed:', { isUserId, profileId, isOwnProfile })
  
  const [activeTab, setActiveTab] = useState('posts')
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [stars, setStars] = useState(0)
  const [withdrawableSTT, setWithdrawableSTT] = useState(0)
  const [isLoadingStars, setIsLoadingStars] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successModalData, setSuccessModalData] = useState(null)
  
  // Edit username modal state
  const [showEditUsernameModal, setShowEditUsernameModal] = useState(false)
  
  // Profile data state
  const [profileData, setProfileData] = useState(null)
  const [userPosts, setUserPosts] = useState([])
  const [mintedNFTs, setMintedNFTs] = useState([])
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false)

  // Fetch profile data
  const fetchProfileData = useCallback(async () => {
    setIsLoadingProfile(true)
    try {
      const checkIsUserId = urlAddress && !urlAddress.startsWith('0x')
      const currentProfileId = urlAddress || myAddress
      
      console.log('Fetching profile:', { urlAddress, myAddress, currentProfileId, checkIsUserId })
      
      if (!currentProfileId) {
        console.error('No profile ID available')
        return
      }
      
      const endpoint = checkIsUserId ? `/users/by-id/${currentProfileId}` : `/users/${currentProfileId}`
      console.log('API endpoint:', endpoint)
      
      const response = await api.get(endpoint)
      if (response.data.success) {
        setProfileData(response.data.user)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setIsLoadingProfile(false)
    }
  }, [urlAddress, myAddress])

  // Fetch user posts
  const fetchUserPosts = useCallback(async () => {
    setIsLoadingPosts(true)
    try {
      const checkIsUserId = urlAddress && !urlAddress.startsWith('0x')
      const currentProfileId = urlAddress || myAddress
      
      if (!currentProfileId) {
        console.error('No profile ID for posts')
        return
      }
      
      const endpoint = checkIsUserId ? `/users/by-id/${currentProfileId}/posts` : `/users/${currentProfileId}/posts`
      const response = await api.get(endpoint)
      if (response.data.success) {
        setUserPosts(response.data.posts)
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setIsLoadingPosts(false)
    }
  }, [urlAddress, myAddress])

  // Fetch minted NFTs
  const fetchMintedNFTs = useCallback(async () => {
    setIsLoadingNFTs(true)
    try {
      const checkIsUserId = urlAddress && !urlAddress.startsWith('0x')
      const currentProfileId = urlAddress || myAddress
      
      if (!currentProfileId) {
        console.error('No profile ID for mints')
        return
      }
      
      const endpoint = checkIsUserId ? `/users/by-id/${currentProfileId}/minted` : `/users/${currentProfileId}/minted`
      const response = await api.get(endpoint)
      if (response.data.success) {
        setMintedNFTs(response.data.mints)
      }
    } catch (error) {
      console.error('Failed to fetch mints:', error)
    } finally {
      setIsLoadingNFTs(false)
    }
  }, [urlAddress, myAddress])

  const fetchStars = useCallback(async () => {
    setIsLoadingStars(true)
    try {
      const currentProfileId = urlAddress || myAddress
      
      if (!currentProfileId) {
        console.error('No profile ID for stars')
        return
      }
      
      const response = await api.get(`/stars/${currentProfileId}`)
      if (response.data.success) {
        setStars(response.data.stars)
        setWithdrawableSTT(response.data.withdrawableSTT)
      }
    } catch (error) {
      console.error('Failed to fetch stars:', error)
    } finally {
      setIsLoadingStars(false)
    }
  }, [urlAddress, myAddress])

  // Check follow status
  const checkFollowStatus = useCallback(async () => {
    if (!profileData?.address || !myAddress || isOwnProfile) return

    try {
      const response = await api.get(`/users/${profileData.address}/is-following?followerAddress=${myAddress}`)
      if (response.data.success) {
        setIsFollowing(response.data.isFollowing)
      }
    } catch (error) {
      console.error('Failed to check follow status:', error)
    }
  }, [profileData?.address, myAddress, isOwnProfile])

  // Handle follow/unfollow
  const handleFollow = async () => {
    if (!profileData?.address || !myAddress) return

    setIsFollowLoading(true)
    try {
      const endpoint = isFollowing ? `/users/${profileData.address}/unfollow` : `/users/${profileData.address}/follow`
      const response = await api.post(endpoint, { followerAddress: myAddress })
      
      if (response.data.success) {
        setIsFollowing(!isFollowing)
        // Update followers count
        setProfileData(prev => ({
          ...prev,
          followersCount: isFollowing ? prev.followersCount - 1 : prev.followersCount + 1
        }))
      }
    } catch (error) {
      console.error('Follow/unfollow error:', error)
      alert('Failed to update follow status')
    } finally {
      setIsFollowLoading(false)
    }
  }


  const handleWithdraw = async (amount) => {
    setIsWithdrawing(true)
    try {
      const address = profileData?.address || profileId
      const response = await api.post('/stars/withdraw', {
        address,
        starsToWithdraw: amount
      })
      
      if (response.data.success) {
        // Show success modal
        setSuccessModalData({
          type: 'withdraw',
          title: '💰 Withdraw Successful!',
          message: `Successfully withdrawn ${amount} stars and received ${response.data.sttAmount} STT tokens.`,
          details: [
            { label: 'Stars Withdrawn', value: `${amount} stars` },
            { label: 'STT Received', value: `${response.data.sttAmount} STT` },
            { label: 'Gas Used', value: response.data.gasUsed },
            { label: 'Block Number', value: response.data.blockNumber }
          ],
          txHash: response.data.txHash
        })
        setShowSuccessModal(true)
        
        // Update state
        setStars(stars - amount)
        setWithdrawableSTT((stars - amount) * 0.1)
        
        // Close modal
        setShowWithdrawModal(false)
      } else {
        alert('❌ Failed to withdraw: ' + response.data.error)
      }
    } catch (error) {
      console.error('Withdraw error:', error)
      alert('❌ Failed to withdraw stars: ' + (error.response?.data?.error || error.message))
    } finally {
      setIsWithdrawing(false)
    }
  }

  const handleUsernameUpdated = (updatedUser) => {
    // Update profile data with new username
    setProfileData(prev => ({
      ...prev,
      username: updatedUser.username
    }))
    
    // Refresh posts to show updated username
    fetchUserPosts()
  }

  // Fetch profile data when urlAddress or myAddress changes
  useEffect(() => {
    const currentProfileId = urlAddress || (myAddress && myAddress !== 'undefined' ? myAddress : null)
    const currentIsOwnProfile = !urlAddress || (myAddress && urlAddress === myAddress)
    
    console.log('useEffect triggered:', { currentProfileId, currentIsOwnProfile, urlAddress, myAddress })
    
    if (currentProfileId) {
      const loadData = async () => {
        await Promise.all([
          currentIsOwnProfile ? fetchStars() : Promise.resolve(),
          fetchProfileData(),
          fetchUserPosts(),
          fetchMintedNFTs()
        ])
      }
      loadData()
    } else {
      console.log('No profileId available, skipping data fetch')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlAddress, myAddress])

  // Check follow status when profileData changes
  useEffect(() => {
    if (profileData) {
      checkFollowStatus()
    }
  }, [profileData, checkFollowStatus])

  const tabs = [
    { id: 'posts', label: 'Posts', count: profileData?.postsCount || 0 },
    { id: 'minted', label: 'Minted', count: profileData?.mintedCount || 0 },
    { id: 'liked', label: 'Liked', count: 0 },
    { id: 'collections', label: 'Collections', count: 0 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text">Profile</h1>
          </div>
          {isOwnProfile && (
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          )}
        </div>
      </div>

      {/* Profile Content */}
      {!profileId ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
          <User className="w-16 h-16 mb-4 text-purple-500" />
          <h2 className="text-2xl font-bold mb-2">No Profile Selected</h2>
          <p className="text-lg mb-6">Please connect your wallet or visit a specific user profile</p>
          <Button 
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-4 rounded-2xl transition-all duration-300"
            onClick={() => window.location.href = '/'}
          >
            Go to Home
          </Button>
        </div>
      ) : (
        <>
          {/* Profile Header */}
          <div className="px-4 py-6">
        <div className="glass-effect rounded-3xl p-6 mb-6">
          {/* Profile Header */}
          <div className="flex items-start space-x-4 mb-6">
            {/* Avatar with SomixPro frame */}
            <div className="relative flex-shrink-0">
              {profileData?.isSomixPro && (
                <div className="absolute -inset-2 bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 rounded-2xl animate-pulse blur-md opacity-75"></div>
              )}
              <div className={clsx(
                "relative rounded-2xl p-0.5",
                profileData?.isSomixPro && "bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 animate-pulse"
              )}>
                <div className={clsx(
                  "rounded-2xl overflow-hidden",
                  profileData?.isSomixPro && "ring-2 ring-yellow-400/50"
                )}>
                  <Avatar
                    src={profileData?.avatarUrl}
                    alt={profileData?.username || 'Anonymous'}
                    size="xl"
                    isVerified={profileData?.isVerified}
                    isSomixPro={profileData?.isSomixPro}
                    className="!rounded-2xl"
                  />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-black flex items-center justify-center z-10">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white mb-1 truncate flex items-center space-x-1.5">
                <span>{isLoadingProfile ? 'Loading...' : (profileData?.username || 'Anonymous')}</span>
                {profileData?.isSomixPro && (
                  <Crown className="w-5 h-5 text-yellow-400" />
                )}
              </h2>
              <p className="text-gray-400 text-sm mb-2 truncate">
                {isLoadingProfile ? '...' : (profileData?.address ? `${profileData.address.slice(0, 6)}...${profileData.address.slice(-4)}` : '')}
              </p>
              <p className="text-gray-300 text-xs mb-3 line-clamp-2">
                {isLoadingProfile ? '...' : (profileData?.bio || 'No bio available.')}
              </p>
              <div className="flex items-center space-x-4 text-xs text-gray-400">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Joined {profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Award className="w-3 h-3" />
                  <span>Creator</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-gray-800/50 rounded-2xl p-4 mb-6">
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-3 rounded-xl bg-gray-700/30 hover:bg-gray-700/50 transition-colors duration-200">
                <div className="text-xl font-bold text-white mb-1">
                  {isLoadingProfile ? '...' : (profileData?.postsCount || 0)}
                </div>
                <div className="text-gray-400 text-xs font-medium">Posts</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-gray-700/30 hover:bg-gray-700/50 transition-colors duration-200">
                <div className="text-xl font-bold text-white mb-1">
                  {isLoadingProfile ? '...' : (profileData?.followersCount || 0)}
                </div>
                <div className="text-gray-400 text-xs font-medium">Followers</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-gray-700/30 hover:bg-gray-700/50 transition-colors duration-200">
                <div className="text-xl font-bold text-white mb-1">
                  {isLoadingProfile ? '...' : (profileData?.followingCount || 0)}
                </div>
                <div className="text-gray-400 text-xs font-medium">Following</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-gray-700/30 hover:bg-gray-700/50 transition-colors duration-200">
                <div className="text-xl font-bold text-white mb-1">
                  {isLoadingProfile ? '...' : (profileData?.mintedCount || 0)}
                </div>
                <div className="text-gray-400 text-xs font-medium">NFTs</div>
              </div>
            </div>
          </div>

          {/* Stars Card - Only show for own profile */}
          {isOwnProfile && (
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-white fill-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white flex items-center space-x-2">
                    {isLoadingStars ? (
                      <Spinner size="sm" />
                    ) : (
                      <>
                        <span>{stars}</span>
                        <span className="text-yellow-400">⭐</span>
                      </>
                    )}
                  </div>
                  <div className="text-gray-300 text-sm">Creator Stars</div>
                  <div className="text-yellow-400 text-xs font-semibold">
                    {withdrawableSTT > 0 ? `${withdrawableSTT} STT withdrawable` : 'No stars to withdraw'}
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setShowWithdrawModal(true)}
                disabled={stars === 0 || isWithdrawing}
                className={clsx(
                  'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold',
                  (stars === 0 || isWithdrawing) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isWithdrawing ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Withdrawing...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    Withdraw Stars
                  </>
                )}
              </Button>
            </div>
          </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {isOwnProfile ? (
              <>
                <Button 
                  className="flex-1 font-semibold px-4 py-2.5 rounded-xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm"
                  onClick={() => setShowEditUsernameModal(true)}
                >
                  <User className="w-4 h-4 mr-2 inline" />
                  Edit Username
                </Button>
                <Button variant="outline" size="sm" className="px-3 py-2.5 rounded-xl">
                  <Share2 className="w-4 h-4 mr-1.5" />
                  Share
                </Button>
              </>
            ) : (
              <>
                <button 
                  className={clsx(
                    'px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 flex items-center justify-center min-w-[90px]',
                    isFollowing 
                      ? 'bg-gray-200 text-gray-800 hover:bg-gray-300 border border-gray-300' 
                      : 'bg-blue-500 text-white hover:bg-blue-600 border border-blue-500'
                  )}
                  onClick={handleFollow}
                  disabled={isFollowLoading}
                >
                  {isFollowLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                      {isFollowing ? 'Unfollowing...' : 'Following...'}
                    </>
                  ) : (
                    <>
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-4 h-4 mr-1.5" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-1.5" />
                          Follow
                        </>
                      )}
                    </>
                  )}
                </button>
                <Button variant="outline" size="sm" className="px-3 py-2.5 rounded-full">
                  <Share2 className="w-4 h-4 mr-1.5" />
                  Share
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-white/5 rounded-2xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300',
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-24">
          {activeTab === 'posts' && (isLoadingPosts ? (
            <div className="col-span-full text-center py-12">
              <Spinner size="lg" />
              <p className="text-gray-400 mt-4">Loading posts...</p>
            </div>
          ) : userPosts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400">No posts yet</p>
            </div>
          ) : (
            userPosts.map((post) => (
              <div key={post._id} className="glass-effect rounded-2xl overflow-hidden hover:scale-[1.02] transition-all duration-300 group">
                <div className="relative">
                  <img
                    src={post.image?.url || post.image?.thumbUrl || 'https://via.placeholder.com/400'}
                    alt={post.caption}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-4">
                  <h4 className="text-white font-semibold mb-2 truncate">{post.caption}</h4>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center space-x-1">
                        <Heart className="w-3 h-3" />
                        <span>{post.likeCount || 0}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>{post.commentCount || 0}</span>
                      </span>
                    </div>
                    <span className="flex items-center space-x-1">
                      <Coins className="w-3 h-3" />
                      <span>{post.editions?.minted || 0}</span>
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          ))}
          
          {activeTab === 'minted' && (isLoadingNFTs ? (
            <div className="col-span-full text-center py-12">
              <Spinner size="lg" />
              <p className="text-gray-400 mt-4">Loading minted NFTs...</p>
            </div>
          ) : mintedNFTs.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400">No minted NFTs yet</p>
            </div>
          ) : (
            mintedNFTs.map((mint) => {
              // Always get image from the post that was minted
              // Priority: backend imageUrl -> postId.image.url -> postId.image.thumbUrl
              const imageUrl = mint.imageUrl || 
                             mint.postId?.image?.url || 
                             mint.postId?.image?.thumbUrl ||
                             null
              
              return (
                <div key={mint._id} className="glass-effect rounded-2xl overflow-hidden hover:scale-[1.02] transition-all duration-300 group">
                  <div className="relative">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Minted NFT"
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          console.error('Failed to load image:', imageUrl)
                          e.target.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Coins className="w-16 h-16 text-white/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-4">
                    <h4 className="text-white font-semibold mb-2 truncate">
                      {mint.postId?.caption || `NFT #${mint.tokenId}`}
                    </h4>
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span className="text-xs">Token ID: {mint.tokenId}</span>
                      <span className="flex items-center space-x-1">
                        <Coins className="w-3 h-3" />
                        <span>Minted</span>
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(mint.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )
            })
          ))}
          
          {(activeTab === 'liked' || activeTab === 'collections') && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400">Coming soon...</p>
            </div>
          )}
        </div>
      </div>
        </>
      )}


      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        onWithdraw={handleWithdraw}
        stars={stars}
        isLoading={isWithdrawing}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          setSuccessModalData(null)
        }}
        onContinue={() => {
          setShowSuccessModal(false)
          setSuccessModalData(null)
        }}
        {...successModalData}
      />

      {/* Edit Username Modal */}
      <EditUsernameModal
        isOpen={showEditUsernameModal}
        onClose={() => setShowEditUsernameModal(false)}
        currentUsername={profileData?.username}
        onUsernameUpdated={handleUsernameUpdated}
      />
    </div>
  )
}