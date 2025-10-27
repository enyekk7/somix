import { useEffect } from 'react'
import { useAccount } from 'wagmi'
import api from '../services/api.js'

export function useAutoRegister() {
  const { address, isConnected } = useAccount()

  useEffect(() => {
    const registerUser = async () => {
      if (!address || !isConnected) return

      try {
        console.log('🔄 Auto-registering user:', address)
        
        const response = await api.post('/users/register', {
          address: address
        })

        if (response.data.success) {
          if (response.data.isNewUser) {
            console.log('✅ New user registered:', address, 'with 100 tokens')
          } else {
            console.log('✅ Existing user found:', address)
          }
        }
      } catch (error) {
        console.error('❌ Auto-register failed:', error)
        // Don't throw error, just log it
      }
    }

    // Add a small delay to ensure wallet is fully connected
    const timeoutId = setTimeout(registerUser, 1000)

    return () => clearTimeout(timeoutId)
  }, [address, isConnected])

  return { address, isConnected }
}

