import { Award, Crown, Star, Sparkles, Zap, Shield, Coins, User, MessageCircle, Image, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAccount, useSendTransaction } from 'wagmi'
import { parseEther } from 'ethers'
import { DEV_WALLET_ADDRESS } from '../web3/contract.js'
import api from '../services/api.js'
import { Spinner } from '../components/Spinner.jsx'

export function SomixPro() {
  const navigate = useNavigate()
  const { address, isConnected } = useAccount()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [error, setError] = useState('')
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successData, setSuccessData] = useState(null)

  // Check subscription status
  useEffect(() => {
    const checkStatus = async () => {
      if (isConnected && address) {
        try {
          const response = await api.get(`/somixpro/status/${address}`)
          if (response.data.success) {
            setIsSubscribed(response.data.isSomixPro)
          }
        } catch (error) {
          console.error('Failed to check SomixPro status:', error)
        }
      }
    }
    checkStatus()
  }, [address, isConnected])

  // Blockchain transaction
  const { sendTransaction, isPending: isSending } = useSendTransaction({
    onSuccess: async (data) => {
      console.log('SomixPro payment transaction sent:', data.hash)
      
      // Wait 2 seconds for transaction to propagate
      setTimeout(async () => {
        try {
          // Activate SomixPro subscription
          const response = await api.post('/somixpro/subscribe', {
            address: address,
            txHash: data.hash
          })

          if (response.data.success) {
            setIsSubscribed(true)
            setIsProcessing(false)
            setError('')
            setSuccessData({
              title: '🎉 Welcome to SomixPro!',
              message: 'Successfully subscribed to SomixPro!',
              txHash: data.hash,
              benefits: [
                '500 token AI image generation',
                'Exclusive SomixPro badge',
                'Early access to new features',
                'Direct support from our team',
                'Exclusive profile frame'
              ]
            })
            setShowSuccessPopup(true)
          } else {
            throw new Error(response.data.error || 'Failed to activate subscription')
          }
        } catch (error) {
          console.error('Activate subscription error:', error)
          setError(error.response?.data?.error || 'Failed to activate subscription')
          setIsProcessing(false)
        }
      }, 2000)
    },
    onError: (error) => {
      console.error('SomixPro payment error:', error)
      setError('Payment failed: ' + error.message)
      setIsProcessing(false)
    }
  })

  const handleSubscribe = () => {
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }

    if (isSubscribed) {
      alert('You are already subscribed to SomixPro!')
      return
    }

    setIsProcessing(true)
    setError('')

    // Send 1 STT to dev wallet (for test, actual is 20 STT)
    sendTransaction({
      to: DEV_WALLET_ADDRESS,
      value: parseEther('1'), // 1 STT for test
    })
  }

  const isProcessingPayment = isProcessing || isSending

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 left-40 w-60 h-60 bg-amber-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 rounded-3xl flex items-center justify-center animate-pulse relative">
              <Crown className="w-12 h-12 text-white absolute" />
              <div className="absolute top-0 right-0 -mt-2 -mr-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 text-yellow-800 fill-current" />
              </div>
            </div>
          </div>
          <h1 className="text-5xl font-bold gradient-text mb-4">SomixPro</h1>
          <p className="text-xl text-gray-400">Unlock premium features and exclusive benefits</p>
        </div>

        {/* Pricing Card */}
        <div className="glass-effect rounded-3xl p-8 mb-12 max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-block px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-sm font-semibold mb-4">
              Premium Membership
            </div>
            <div className="text-5xl font-bold text-white mb-2">
              $19.99<span className="text-2xl text-gray-400">/month</span>
            </div>
            <p className="text-gray-400">Or save 20% with annual billing</p>
            
            {/* Disclaimer */}
            <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-xl">
              <p className="text-yellow-400 text-sm text-center">
                ⚠️ Somix is still in testnet phase. $19.99 can be paid with 19.9 STT.
              </p>
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                <Coins className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-gray-300">500 token AI image generation</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                <Award className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-gray-300">Exclusive SomixPro badge</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-gray-300">Early access to new features</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-gray-300">Direct support from our team</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-gray-300">Exclusive profile frame</span>
            </div>
          </div>

          {isSubscribed ? (
            <div className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl flex items-center justify-center space-x-2">
              <Crown className="w-5 h-5" />
              <span>You are a SomixPro Member!</span>
            </div>
          ) : (
            <>
              <button
                onClick={handleSubscribe}
                disabled={isProcessingPayment}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isProcessingPayment ? (
                  <>
                    <Spinner size="sm" />
                    <span>Processing payment...</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5" />
                    <span>Subscribe Now - 1 STT</span>
                  </>
                )}
              </button>
              {error && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}
              <p className="text-xs text-gray-500 text-center mt-3">
                * Test mode: 1 STT. Actual subscription: 19.9 STT
              </p>
            </>
          )}
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="glass-effect rounded-3xl p-6 hover:scale-105 transition-all duration-300">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Lightning Fast</h3>
            </div>
            <p className="text-gray-400">Get priority processing for all operations</p>
          </div>

          <div className="glass-effect rounded-3xl p-6 hover:scale-105 transition-all duration-300">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Secure</h3>
            </div>
            <p className="text-gray-400">Enhanced security and privacy protection</p>
          </div>

          <div className="glass-effect rounded-3xl p-6 hover:scale-105 transition-all duration-300">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-pink-500/20 rounded-xl">
                <Award className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Exclusive</h3>
            </div>
            <p className="text-gray-400">Access to premium content and features</p>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="glass-effect rounded-3xl p-8 text-center">
          <div className="inline-block px-4 py-2 bg-purple-500/20 text-purple-400 rounded-full text-sm font-semibold mb-4">
            Coming Soon
          </div>
          <p className="text-gray-400 text-lg">
            SomixPro is currently under development and will be available soon!
          </p>
        </div>

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

      {/* Success Popup */}
      {showSuccessPopup && successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => {
              setShowSuccessPopup(false)
              setSuccessData(null)
            }}
          />
          
          {/* Popup */}
          <div className="relative glass-effect rounded-3xl p-8 max-w-lg w-full animate-in zoom-in-95 duration-300">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-bounce">
                <Crown className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-3xl font-bold text-white text-center mb-4">
              {successData.title}
            </h3>

            {/* Message */}
            <p className="text-gray-300 text-center mb-6">
              {successData.message}
            </p>

            {/* Transaction Hash */}
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Transaction Hash</span>
                <span className="text-sm font-mono text-purple-400 break-all">
                  {successData.txHash.slice(0, 10)}...{successData.txHash.slice(-8)}
                </span>
              </div>
            </div>

            {/* Benefits */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-white mb-3 text-center">Your Premium Benefits:</h4>
              <div className="space-y-2">
                {successData.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-gray-300 text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowSuccessPopup(false)
                  setSuccessData(null)
                }}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300"
              >
                Awesome!
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-xl transition-all duration-300"
              >
                View Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
