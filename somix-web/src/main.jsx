import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiConfig } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import App from './App.jsx'
import './styles/globals.css'
import { config, chains } from './app/web3/wagmi.js'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

// Check wallet connection status on mount
console.log('🔍 Checking wallet persistence...')
const storageKey = 'wagmi.store'
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem(storageKey)
  console.log('💾 Stored wallet data:', stored ? 'Found' : 'Not found')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <WagmiConfig config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider chains={chains}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiConfig>
)

