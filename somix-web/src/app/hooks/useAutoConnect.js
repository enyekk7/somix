import { useEffect, useState } from 'react'
import { useAccount, useConnect } from 'wagmi'

/**
 * Auto-connect wallet on page load
 * wagmi's autoConnect should handle this, but we add extra logic for reliability
 */
export function useAutoConnect() {
  const { address, isConnected, isConnecting } = useAccount()
  const { connect, connectors } = useConnect()
  const [attempted, setAttempted] = useState(false)

  useEffect(() => {
    // Skip if already connected, connecting, or already attempted
    if (isConnected || isConnecting || attempted) {
      return
    }

    const tryAutoConnect = async () => {
      console.log('🔍 Checking for stored wallet...')
      
      try {
        // Check if we have a stored connection in localStorage
        const wagmiStore = localStorage.getItem('wagmi.store')
        const wagmiConnected = localStorage.getItem('wagmi.connected')
        
        console.log('📦 Wagmi localStorage check:', {
          hasStore: !!wagmiStore,
          hasConnected: !!wagmiConnected
        })
        
        // If we have stored data, try to reconnect
        if ((wagmiStore || wagmiConnected) && connectors && connectors.length > 0) {
          console.log('🔄 Attempting to reconnect with stored wallet...')
          
          // Try MetaMask first (most common)
          const metaMask = connectors.find(c => c.id === 'metaMask')
          if (metaMask) {
            try {
              await connect({ connector: metaMask })
              console.log('✅ Auto-reconnected successfully')
            } catch (error) {
              console.warn('⚠️ Auto-reconnect failed:', error.message)
            }
          }
        } else {
          console.log('ℹ️ No stored wallet found')
        }
        
        setAttempted(true)
      } catch (error) {
        console.warn('⚠️ Auto-connect check failed:', error)
        setAttempted(true)
      }
    }

    // Wait a bit for wagmi to fully initialize
    const timer = setTimeout(tryAutoConnect, 1500)
    return () => clearTimeout(timer)
  }, [isConnected, isConnecting, connectors, connect, attempted])

  return { address, isConnected }
}

