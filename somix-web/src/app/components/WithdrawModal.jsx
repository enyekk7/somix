import React, { useState } from 'react'

const WithdrawModal = ({ isOpen, onClose, onWithdraw, stars, isLoading }) => {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!amount || isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (parseInt(amount) > stars) {
      setError('Insufficient stars balance')
      return
    }

    onWithdraw(parseInt(amount))
  }

  const handleClose = () => {
    setAmount('')
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Withdraw Stars</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isLoading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stars Info */}
        <div className="bg-gray-800 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Available Stars</span>
            <span className="text-yellow-400 font-semibold">{stars}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-gray-300">Withdrawable STT</span>
            <span className="text-green-400 font-semibold">{(stars * 0.1).toFixed(2)} STT</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Amount to Withdraw
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter stars amount"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                min="1"
                max={stars}
                disabled={isLoading}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                stars
              </div>
            </div>
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
          </div>

          {/* Preview */}
          {amount && !error && (
            <div className="bg-purple-900 bg-opacity-30 rounded-lg p-4 mb-6 border border-purple-500">
              <div className="text-center">
                <p className="text-gray-300 text-sm">You will receive</p>
                <p className="text-purple-400 font-bold text-lg">
                  {(parseFloat(amount) * 0.1).toFixed(2)} STT
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Transaction will be sent from developer wallet to your wallet
                </p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !amount || error}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                'Withdraw'
              )}
            </button>
          </div>
        </form>

        {/* Info */}
        <div className="mt-4 p-3 bg-blue-900 bg-opacity-30 rounded-lg border border-blue-500">
          <p className="text-blue-300 text-xs">
            💡 <strong>Rate:</strong> 1 star = 0.1 STT<br/>
            ⚡ <strong>Network:</strong> Somnia Testnet<br/>
            🔒 <strong>Security:</strong> Transaction sent from developer wallet
          </p>
        </div>
      </div>
    </div>
  )
}

export default WithdrawModal
