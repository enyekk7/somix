import { useWallet } from '../hooks/useWallet.js'
import { ExternalLink, Coins, AlertCircle, CheckCircle } from 'lucide-react'
import { clsx } from 'clsx'

export function NetworkInfo() {
  const { chain, isConnected, isCorrectNetwork, isSomniaTestnet, isSomniaMainnet } = useWallet()

  if (!isConnected) return null

  return (
    <div className="fixed bottom-24 right-4 z-40 max-w-sm">
      <div className="glass-effect rounded-xl p-4 space-y-3">
        {/* Network Status */}
        <div className="flex items-center gap-2">
          {isCorrectNetwork ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-yellow-400" />
          )}
          <span className="text-sm font-medium text-white">
            {isCorrectNetwork ? 'Connected to Somnia' : 'Wrong Network'}
          </span>
        </div>

        {/* Current Chain Info */}
        <div className="text-xs text-gray-300">
          <div>Chain: {chain?.name || 'Unknown'}</div>
          <div>Chain ID: {chain?.id || 'Unknown'}</div>
        </div>

        {/* Faucet Links */}
        {isSomniaTestnet && (
          <div className="space-y-2">
            <div className="text-xs text-gray-400">Get Test Tokens (STT):</div>
            <div className="flex flex-col gap-1">
              <a
                href="https://testnet.somnia.network/"
                target="_blank"
                rel="noopener noreferrer"
                className={clsx(
                  'flex items-center gap-2 px-2 py-1 rounded text-xs',
                  'bg-blue-600 hover:bg-blue-700 text-white',
                  'transition-colors duration-200'
                )}
              >
                <Coins className="w-3 h-3" />
                Official Faucet
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://stakely.io/faucet/somnia-testnet-stt"
                target="_blank"
                rel="noopener noreferrer"
                className={clsx(
                  'flex items-center gap-2 px-2 py-1 rounded text-xs',
                  'bg-purple-600 hover:bg-purple-700 text-white',
                  'transition-colors duration-200'
                )}
              >
                <Coins className="w-3 h-3" />
                Stakely Faucet
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Explorer Link */}
        {chain?.blockExplorers?.default && (
          <a
            href={`${chain.blockExplorers.default.url}/address/${chain.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={clsx(
              'flex items-center gap-2 px-2 py-1 rounded text-xs',
              'bg-gray-700 hover:bg-gray-600 text-white',
              'transition-colors duration-200'
            )}
          >
            <ExternalLink className="w-3 h-3" />
            View on Explorer
          </a>
        )}
      </div>
    </div>
  )
}
