import { createConfig, configureChains } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { getDefaultWallets } from '@rainbow-me/rainbowkit'

// Define Somnia Testnet chain based on official documentation
export const somniaTestnet = {
  id: 50312,
  name: 'Somnia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Somnia Test Token',
    symbol: 'STT',
  },
  rpcUrls: {
    default: {
      http: ['https://dream-rpc.somnia.network'],
    },
    public: {
      http: ['https://dream-rpc.somnia.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Shannon Explorer',
      url: 'https://shannon-explorer.somnia.network',
    },
  },
  testnet: true,
}

// Define Somnia Mainnet chain
export const somniaMainnet = {
  id: 5031,
  name: 'Somnia Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Somnia Token',
    symbol: 'SOMI',
  },
  rpcUrls: {
    default: {
      http: ['https://api.infra.mainnet.somnia.network/'],
    },
    public: {
      http: ['https://api.infra.mainnet.somnia.network/'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Somnia Explorer',
      url: 'https://explorer.somnia.network',
    },
  },
  testnet: false,
}

// Configure chains with providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [somniaTestnet, somniaMainnet, sepolia],
  [publicProvider()]
)

// Get WalletConnect project ID from environment or use a valid one
// You MUST get your own project ID from https://cloud.walletconnect.com/
const projectId = '6a15991598e350bc38b1b8bc15997737'

// Debug logging
console.log('🔧 WalletConnect Configuration:')
console.log('- Final Project ID:', projectId)
console.log('- Project ID Length:', projectId.length)
console.log('- Timestamp:', new Date().toISOString())

const { connectors } = getDefaultWallets({
  appName: 'Somix',
  projectId,
  chains,
})

export const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
  ssr: false,
})

export { chains }