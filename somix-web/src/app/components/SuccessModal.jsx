import React from 'react'
import { CheckCircle, X, Sparkles, Coins, ExternalLink } from 'lucide-react'

const SuccessModal = ({ isOpen, onClose, type, title, message, details, txHash, onContinue }) => {
  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'post':
        return <Sparkles className="w-16 h-16 text-green-400" />
      case 'mint':
        return <Coins className="w-16 h-16 text-purple-400" />
      case 'withdraw':
        return <CheckCircle className="w-16 h-16 text-blue-400" />
      default:
        return <CheckCircle className="w-16 h-16 text-green-400" />
    }
  }

  const getBackgroundGradient = () => {
    switch (type) {
      case 'post':
        return 'from-green-500/20 to-emerald-500/20'
      case 'mint':
        return 'from-purple-500/20 to-pink-500/20'
      case 'withdraw':
        return 'from-blue-500/20 to-cyan-500/20'
      default:
        return 'from-green-500/20 to-emerald-500/20'
    }
  }

  const getBorderColor = () => {
    switch (type) {
      case 'post':
        return 'border-green-500/30'
      case 'mint':
        return 'border-purple-500/30'
      case 'withdraw':
        return 'border-blue-500/30'
      default:
        return 'border-green-500/30'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative bg-gray-900 rounded-3xl p-8 w-full max-w-md border border-white/10 animate-fade-in">
        {/* Animated Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${getBackgroundGradient()} rounded-3xl opacity-50`}></div>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Content */}
        <div className="relative z-10 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className={`p-4 rounded-full bg-gradient-to-br ${getBackgroundGradient()} ${getBorderColor()} border-2`}>
              {getIcon()}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-3">
            {title}
          </h2>

          {/* Message */}
          <p className="text-gray-300 text-lg mb-6">
            {message}
          </p>

          {/* Details */}
          {details && (
            <div className={`bg-gradient-to-r ${getBackgroundGradient()} rounded-2xl p-4 mb-6 border ${getBorderColor()}`}>
              <div className="text-left space-y-2">
                {details.map((detail, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">{detail.label}</span>
                    <span className="text-white font-semibold text-sm">{detail.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transaction Hash */}
          {txHash && (
            <div className="bg-gray-800 rounded-xl p-4 mb-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Transaction Hash</span>
                <button
                  onClick={() => window.open(`https://explorer.somnia.network/tx/${txHash}`, '_blank')}
                  className="flex items-center space-x-1 text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <span className="text-xs font-mono">{txHash.slice(0, 8)}...{txHash.slice(-8)}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={onContinue || onClose}
            className={`w-full bg-gradient-to-r ${
              type === 'post' ? 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600' :
              type === 'mint' ? 'from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' :
              type === 'withdraw' ? 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600' :
              'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
            } text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg`}
          >
            {type === 'post' ? 'View Post' : 
             type === 'mint' ? 'View NFT' : 
             type === 'withdraw' ? 'Continue' : 
             'Continue'}
          </button>
        </div>

        {/* Floating Particles Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/20 rounded-full animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-white/30 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-white/25 rounded-full animate-pulse delay-500"></div>
        </div>
      </div>
    </div>
  )
}

export default SuccessModal
