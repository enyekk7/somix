import { useState, useEffect, useCallback } from 'react'
import { Target, Trophy, CheckCircle, Award, Star, TrendingUp, Gift, Loader, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../hooks/useWallet'
import { getMissionProgress, checkMissionProgress, claimMissionReward } from '../services/missions'

export function Mission() {
  const navigate = useNavigate()
  const { address } = useWallet()
  const [missions, setMissions] = useState([])
  const [stats, setStats] = useState({ completed: 0, totalTokens: 0 })
  const [loading, setLoading] = useState(false)
  const [claiming, setClaiming] = useState(null)
  const [showClaimSuccess, setShowClaimSuccess] = useState(false)
  const [claimData, setClaimData] = useState(null)
  const [dailyCheckinData, setDailyCheckinData] = useState(null)

  const loadMissions = useCallback(async () => {
    if (!address) {
      console.log('❌ No user address found')
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      console.log('📡 Loading missions for address:', address)
      const data = await getMissionProgress(address)
      console.log('✅ Missions loaded:', data)
      setMissions(data.missions || [])
      setDailyCheckinData(data.dailyCheckin)
      setStats({
        completed: data.totalCompleted || 0,
        totalTokens: data.totalTokens || 0
      })
    } catch (error) {
      console.error('❌ Error loading missions:', error)
      console.error('Error details:', error.response?.data || error.message)
    } finally {
      setLoading(false)
    }
  }, [address])

  useEffect(() => {
    loadMissions()
  }, [loadMissions])

  const handleCheckProgress = async () => {
    try {
      await checkMissionProgress(address)
      loadMissions() // Reload to show updates
    } catch (error) {
      console.error('Error checking progress:', error)
    }
  }

  const handleClaim = async (missionId, reward) => {
    try {
      setClaiming(missionId)
      const result = await claimMissionReward(address, missionId)
      
      // Show success popup
      setClaimData({
        message: result.message,
        tokensReceived: result.tokensReceived,
        newBalance: result.newBalance
      })
      setShowClaimSuccess(true)
      
      // Reload missions
      loadMissions()
      
      // Auto-hide popup after 3 seconds
      setTimeout(() => {
        setShowClaimSuccess(false)
        setClaimData(null)
      }, 3000)
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to claim reward')
    } finally {
      setClaiming(null)
    }
  }


  if (!address) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-yellow-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-yellow-400" />
          <p className="text-gray-400">Please connect your wallet to view missions</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-yellow-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-3xl flex items-center justify-center animate-pulse">
              <Target className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold gradient-text mb-4">Missions</h1>
          <p className="text-xl text-gray-400">Complete missions to earn tokens</p>
        </div>

        {/* Refresh Progress Button */}
        <div className="mb-8">
          <button
            onClick={handleCheckProgress}
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Refresh Progress</span>
              </>
            )}
          </button>
        </div>

        {/* Missions List */}
        <div className="space-y-4 mb-8">
          {loading ? (
            <div className="glass-effect rounded-3xl p-12 text-center">
              <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-yellow-400" />
              <p className="text-gray-400">Loading missions...</p>
            </div>
          ) : (
            missions.map((mission) => (
              <div key={mission.id} className="glass-effect rounded-3xl p-6 hover:scale-[1.01] transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`p-3 ${mission.completed ? 'bg-green-500/20' : 'bg-gray-700/20'} rounded-xl`}>
                      {mission.completed ? (
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      ) : (
                        <Target className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-1">{mission.title}</h3>
                      <p className="text-sm text-gray-400">{mission.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 px-4 py-2 bg-yellow-500/20 rounded-xl">
                    <Gift className="w-5 h-5 text-yellow-400" />
                    <span className="font-bold text-yellow-400">{mission.reward}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white font-semibold">
                      {mission.progress || 0} / {mission.targetCount}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700/30 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full transition-all duration-300" 
                      style={{ width: `${mission.progressPercent || 0}%` }} 
                    />
                  </div>
                </div>

                {/* Claim Button */}
                {mission.completed && (
                  <button
                    onClick={() => handleClaim(mission.id, mission.reward)}
                    disabled={mission.claimed || claiming === mission.id}
                    className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
                      mission.claimed
                        ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                    }`}
                  >
                    {claiming === mission.id ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Claiming...</span>
                      </>
                    ) : mission.claimed ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>Claimed</span>
                      </>
                    ) : (
                      <>
                        <Gift className="w-5 h-5" />
                        <span>Claim {mission.reward} Tokens</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Back Button */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300"
          >
            Back to Home
          </button>
        </div>
      </div>

      {/* Success Popup */}
      {showClaimSuccess && claimData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => {
              setShowClaimSuccess(false)
              setClaimData(null)
            }}
          />
          
          {/* Popup */}
          <div className="relative glass-effect rounded-3xl p-8 max-w-md w-full animate-in zoom-in-95 duration-300">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-white text-center mb-4">
              🎉 Reward Claimed!
            </h3>

            {/* Message */}
            <p className="text-gray-300 text-center mb-6">
              {claimData.message}
            </p>

            {/* Token Info */}
            <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400">Tokens Received</span>
                <span className="text-2xl font-bold text-green-400">
                  +{claimData.tokensReceived}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">New Balance</span>
                <span className="text-xl font-bold text-white">
                  {claimData.newBalance} tokens
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                setShowClaimSuccess(false)
                setClaimData(null)
              }}
              className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
