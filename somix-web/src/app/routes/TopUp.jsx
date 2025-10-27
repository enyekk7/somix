import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount, useSendTransaction } from 'wagmi'
import { parseEther } from 'ethers'
import { Coins, Check, ArrowLeft, Sparkles, Zap } from 'lucide-react'
import { clsx } from 'clsx'
import { Button } from '../components/Button.jsx'
import { Spinner } from '../components/Spinner.jsx'
import api from '../services/api.js'
import { DEV_WALLET_ADDRESS } from '../web3/contract.js'

export function TopUp() {
  const navigate = useNavigate()
  const { address, isConnected } = useAccount()
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [paymentHash, setPaymentHash] = useState(null)
  
  // Blockchain transaction
  const { data: hash, sendTransaction, isPending: isSending } = useSendTransaction({
    onSuccess: async (data) => {
      console.log('Payment transaction sent:', data.hash)
      setPaymentHash(data.hash)
      // Wait a bit for transaction to propagate
      setTimeout(() => {
        addTokensToDatabase(data.hash)
      }, 2000)
    },
    onError: (error) => {
      console.error('Payment transaction error:', error)
      alert('Transaction failed: ' + error.message)
      setSelectedPackage(null)
    }
  })

  const packages = [
    {
      id: 100,
      tokens: 100,
      price: 5,
      popular: false,
      color: 'from-blue-500 to-cyan-500',
      icon: <Zap className="w-6 h-6" />
    },
    {
      id: 300,
      tokens: 300,
      price: 12,
      popular: true,
      savings: 3,
      color: 'from-purple-500 to-pink-500',
      icon: <Sparkles className="w-6 h-6" />
    },
    {
      id: 500,
      tokens: 500,
      price: 18,
      popular: false,
      savings: 7,
      color: 'from-yellow-500 to-orange-500',
      icon: <Coins className="w-6 h-6" />
    }
  ]

  const handleTopUp = async (pkg) => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first')
      return
    }

    setSelectedPackage(pkg)

    // Send STT to dev wallet via blockchain
    try {
      sendTransaction({
        to: DEV_WALLET_ADDRESS,
        value: parseEther(pkg.price.toString()) // Convert STT to wei
      })
    } catch (error) {
      console.error('Send transaction error:', error)
      alert('Failed to initiate payment: ' + error.message)
    }
  }
  
  const addTokensToDatabase = async (txHash) => {
    try {
      const response = await api.post('/tokens/topup', {
        address: address,
        amount: selectedPackage.tokens,
        txHash: txHash
      })

      if (response.data.success) {
        setShowSuccess(true)
        setTimeout(() => {
          setShowSuccess(false)
          setSelectedPackage(null)
          setPaymentHash(null)
          navigate('/post')
        }, 2000)
      } else {
        alert(response.data.error || 'Failed to add tokens to account')
        setSelectedPackage(null)
      }
    } catch (error) {
      console.error('Add tokens error:', error)
      alert(error.response?.data?.error || 'Failed to add tokens to account')
      setSelectedPackage(null)
    }
  }
  
  const isProcessing = isSending

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <button
          onClick={() => navigate('/post')}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Create</span>
        </button>

        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center animate-pulse">
              <Coins className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold gradient-text mb-4">Top Up Tokens</h1>
          <p className="text-xl text-gray-400">Purchase tokens to create amazing AI art</p>
          <p className="text-sm text-gray-500 mt-2">Payment will be sent to developer wallet</p>
        </div>

        {/* Warning Message */}
        {!isConnected && (
          <div className="glass-effect rounded-3xl p-6 mb-8 text-center">
            <p className="text-yellow-400">
              ⚠️ Please connect your wallet to purchase tokens
            </p>
          </div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <div className="glass-effect rounded-3xl p-6 mb-8 text-center bg-green-500/20 border border-green-500/50">
            <div className="flex items-center justify-center space-x-2 text-green-400">
              <Check className="w-6 h-6" />
              <p className="text-xl font-bold">Tokens Added Successfully!</p>
            </div>
          </div>
        )}

        {/* Pricing Packages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={clsx(
                "glass-effect rounded-3xl p-8 relative hover:scale-105 transition-all duration-300",
                pkg.popular && "ring-2 ring-purple-500",
                isProcessing && selectedPackage?.id !== pkg.id && "opacity-50 pointer-events-none"
              )}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                  MOST POPULAR
                </div>
              )}

              {pkg.savings && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  Save {pkg.savings} STT
                </div>
              )}

              <div className="text-center">
                <div className={clsx("w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r flex items-center justify-center text-white", pkg.color)}>
                  {pkg.icon}
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">{pkg.tokens} Tokens</h3>
                <div className="flex items-baseline justify-center space-x-2 mb-6">
                  <span className="text-4xl font-bold text-white">{pkg.price}</span>
                  <span className="text-gray-400">STT</span>
                </div>

                <div className="space-y-2 mb-6 text-sm text-gray-400">
                  <div className="flex items-center justify-center space-x-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>{Math.floor(pkg.tokens / 20)} AI Images</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>{pkg.tokens / 20} generations</span>
                  </div>
                </div>

                <Button
                  onClick={() => handleTopUp(pkg)}
                  disabled={!isConnected || isProcessing}
                  className={clsx(
                    "w-full py-4 font-bold rounded-xl transition-all duration-300",
                    pkg.popular
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  )}
                >
                  {isProcessing && selectedPackage?.id === pkg.id ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Spinner size="sm" />
                      <span>{isSending ? 'Confirm in Wallet...' : 'Confirming...'}</span>
                    </div>
                  ) : (
                    `Pay ${pkg.price} STT`
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="glass-effect rounded-3xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="space-y-2">
              <div className="text-3xl mb-2">1️⃣</div>
              <h4 className="font-bold text-white">Choose Package</h4>
              <p className="text-gray-400 text-sm">Select the token package that suits your needs</p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl mb-2">2️⃣</div>
              <h4 className="font-bold text-white">Pay with STT</h4>
              <p className="text-gray-400 text-sm">Send STT to the developer wallet (automatic)</p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl mb-2">3️⃣</div>
              <h4 className="font-bold text-white">Start Creating</h4>
              <p className="text-gray-400 text-sm">Use tokens to generate amazing AI art</p>
            </div>
          </div>
        </div>

        {/* Pricing Info */}
        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>💰 100 Tokens = 5 STT • 20 Tokens per AI Image</p>
          <p className="mt-2">Payment will be sent to developer wallet automatically</p>
        </div>
      </div>
    </div>
  )
}
