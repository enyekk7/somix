import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { WalletConnect } from '../components/WalletConnect.jsx'
import { Wallet, ArrowLeft } from 'lucide-react'
import { Button } from '../components/Button.jsx'

export function LoginPage({ onLoginSuccess }) {
  const { address, isConnected } = useAccount()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isConnected && address) {
      setIsLoading(true)
      // Simulate loading time
      setTimeout(() => {
        setIsLoading(false)
        onLoginSuccess()
      }, 1000)
    }
  }, [isConnected, address, onLoginSuccess])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Somix</h1>
          <p className="text-gray-400">Connect your wallet to continue</p>
        </div>

        {/* Login Card */}
        <div className="glass-effect rounded-3xl p-8 text-center">
          {isLoading ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              <p className="text-white">Connecting wallet...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <Wallet className="w-12 h-12 text-purple-400 mx-auto" />
                <h2 className="text-xl font-semibold text-white">Connect Your Wallet</h2>
                <p className="text-gray-400 text-sm">
                  Connect your wallet to access all features including posts, notifications, and profile management.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-center">
                  <WalletConnect />
                </div>
                <p className="text-xs text-gray-500">
                  By connecting your wallet, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Features Preview */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="glass-effect rounded-xl p-4">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <span className="text-blue-400 text-sm">📝</span>
            </div>
            <p className="text-xs text-gray-400">Create Posts</p>
          </div>
          <div className="glass-effect rounded-xl p-4">
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <span className="text-green-400 text-sm">🔔</span>
            </div>
            <p className="text-xs text-gray-400">Notifications</p>
          </div>
          <div className="glass-effect rounded-xl p-4">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <span className="text-purple-400 text-sm">👤</span>
            </div>
            <p className="text-xs text-gray-400">Profile</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProtectedRoute({ children, fallback }) {
  const { isConnected } = useAccount()
  const [showLogin, setShowLogin] = useState(false)

  useEffect(() => {
    if (!isConnected) {
      setShowLogin(true)
    } else {
      setShowLogin(false)
    }
  }, [isConnected])

  if (showLogin) {
    return (
      <LoginPage 
        onLoginSuccess={() => setShowLogin(false)} 
      />
    )
  }

  return children
}
