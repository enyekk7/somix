import { useAccount, useConnect, useDisconnect, useNetwork } from 'wagmi'
import { somniaTestnet, somniaMainnet } from '../web3/wagmi.js'

export function useWallet() {
  const { address, isConnected, isConnecting } = useAccount()
  const { connect, connectors, error: connectError, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { chain, chains } = useNetwork()

  const switchToSomniaTestnet = () => {
    // For wagmi v1, chain switching is handled by RainbowKit
    console.log('Switch to Somnia Testnet requested')
  }

  const switchToSomniaMainnet = () => {
    // For wagmi v1, chain switching is handled by RainbowKit
    console.log('Switch to Somnia Mainnet requested')
  }

  const isSomniaTestnet = chain?.id === somniaTestnet.id
  const isSomniaMainnet = chain?.id === somniaMainnet.id
  const isCorrectNetwork = isSomniaTestnet || isSomniaMainnet

  return {
    address,
    isConnected,
    isConnecting,
    chain,
    chains,
    connect,
    disconnect,
    connectors,
    connectError,
    isPending,
    switchToSomniaTestnet,
    switchToSomniaMainnet,
    isSomniaTestnet,
    isSomniaMainnet,
    isCorrectNetwork,
  }
}
