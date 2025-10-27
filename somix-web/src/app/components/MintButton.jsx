import { useState } from 'react'
import { Coins, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { Button } from './Button.jsx'
import { Spinner } from './Spinner.jsx'
import SuccessModal from './SuccessModal.jsx'
import { nftService } from '../services/nft.js'
import { useAccount, useContractWrite, useWaitForTransaction, useContractRead } from 'wagmi'
import { SOMIX_NFT_ABI, SOMIX_NFT_CONTRACT_TESTNET, SOMIX_NFT_CONTRACT_MAINNET } from '../web3/contract.js'
import { useNetwork } from 'wagmi'
import api from '../services/api.js'

export function MintButton({ post, onMintSuccess }) {
  const { address } = useAccount()
  const { chain } = useNetwork()
  const [isPreparing, setIsPreparing] = useState(false)
  const [mintError, setMintError] = useState(null)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [tokenURI, setTokenURI] = useState(null)
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successModalData, setSuccessModalData] = useState(null)
  
  // Get contract address from post (new system) or fallback to old system
  const contractAddress = post.nftContractAddress || (chain?.id === 5031 
    ? SOMIX_NFT_CONTRACT_MAINNET 
    : SOMIX_NFT_CONTRACT_TESTNET)

  // Debug: Read contract state
  const { data: mintingEnabled } = useContractRead({
    address: contractAddress,
    abi: SOMIX_NFT_ABI,
    functionName: 'mintingEnabled'
  })

  const { data: mintPrice } = useContractRead({
    address: contractAddress,
    abi: SOMIX_NFT_ABI,
    functionName: 'mintPrice'
  })

  const { data: totalMinted } = useContractRead({
    address: contractAddress,
    abi: SOMIX_NFT_ABI,
    functionName: 'totalMinted'
  })

  const { data: maxSupply } = useContractRead({
    address: contractAddress,
    abi: SOMIX_NFT_ABI,
    functionName: 'maxSupply'
  })

  const { data: contractOwner } = useContractRead({
    address: contractAddress,
    abi: SOMIX_NFT_ABI,
    functionName: 'owner'
  })

  // Debug logging
  console.log('Contract Debug Info:', {
    contractAddress,
    mintingEnabled,
    mintPrice: mintPrice ? mintPrice.toString() : 'undefined',
    totalMinted: totalMinted ? totalMinted.toString() : 'undefined',
    maxSupply: maxSupply ? maxSupply.toString() : 'undefined',
    contractOwner: contractOwner || 'undefined',
    developerWallet: '0x862c8f5c105981d88675a4825ae9a7e62103ae39',
    isOwner: contractOwner && address && contractOwner.toLowerCase() === address.toLowerCase()
  })

  // Wagmi hooks for contract interaction
  const { 
    write: mint, 
    data: mintData, 
    isLoading: isMinting,
    error: writeError 
  } = useContractWrite({
    address: contractAddress,
    abi: SOMIX_NFT_ABI,
    functionName: 'publicMint',
    onSuccess: (data) => {
      console.log('Mint transaction sent:', data.hash)
    },
    onError: (error) => {
      console.error('Mint transaction error:', error)
      
      // Check if it's a balance issue
      if (error.message.includes('insufficient funds') || error.message.includes('Insufficient payment')) {
        setMintError('Insufficient STT balance. You need at least 0.2 STT to mint. Get tokens from https://faucet.somnia.network/')
      } else {
        setMintError(error.message)
      }
      
      setIsPreparing(false)
    }
  })

  // Withdraw function for contract owner
  const { 
    write: withdraw, 
    data: withdrawData, 
    isLoading: isWithdrawing,
    error: withdrawError 
  } = useContractWrite({
    address: contractAddress,
    abi: SOMIX_NFT_ABI,
    functionName: 'withdraw',
    onSuccess: (data) => {
      console.log('Withdraw transaction sent:', data.hash)
    },
    onError: (error) => {
      console.error('Withdraw transaction error:', error)
    }
  })

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: mintData?.hash,
    enabled: !!mintData?.hash,
    onSuccess: async (data) => {
      console.log('Mint confirmed:', data)
      setIsConfirmed(true)
      
      // Record mint on backend
      try {
        await nftService.recordMint({
          postId: post._id,
          tokenURI: tokenURI || `ipfs://metadata-${post._id}`,
          txHash: data.transactionHash,
          tokenId: post.editions.minted + 1,
          contractAddress: contractAddress,
          minter: address
        })
        
        // Add stars to creator (2 stars per mint)
        try {
          console.log('⭐ Adding stars to creator:', {
            creatorAddress: post.authorAddress,
            postId: post._id
          })
          const starsResponse = await api.post('/stars/add', {
            creatorAddress: post.authorAddress,
            starsAmount: 2
          })
          console.log('✅ Stars added to creator:', starsResponse.data)
        } catch (starsError) {
          console.error('❌ Failed to add stars:', starsError)
          console.error('Stars error details:', starsError.response?.data)
        }
        
        // Withdraw minting fees to developer wallet via backend API
        try {
          console.log('Withdrawing minting fees to developer wallet via API...')
          console.log('Contract address:', contractAddress)
          console.log('Developer wallet:', '0x862c8f5c105981d88675a4825ae9a7e62103ae39')
          
          // Call backend API to perform withdraw
          const withdrawResponse = await api.post('/withdraw')
          
          if (withdrawResponse.data.success) {
            console.log('✅ Automatic withdraw successful!')
            console.log('Transaction Hash:', withdrawResponse.data.transactionHash)
            console.log('Balance Before:', withdrawResponse.data.balanceBefore, 'STT')
            console.log('Balance After:', withdrawResponse.data.balanceAfter, 'STT')
            console.log('Developer Balance:', withdrawResponse.data.developerBalance, 'STT')
          } else {
            console.warn('⚠️ Withdraw failed:', withdrawResponse.data.error)
          }
          
        } catch (withdrawError) {
          console.error('Failed to withdraw minting fees:', withdrawError)
          console.log('Note: Withdraw will be attempted automatically via backend')
          // Don't fail the whole process if withdraw fails
        }
        
        if (onMintSuccess) {
          onMintSuccess(data.transactionHash)
        }
        
        // Show success modal
        setSuccessModalData({
          type: 'mint',
          title: '🎉 NFT Minted Successfully!',
          message: `You have successfully minted an NFT from this post! The creator earned 2 stars.`,
          details: [
            { label: 'Post Title', value: post.caption?.substring(0, 30) + '...' || 'Untitled' },
            { label: 'Creator Earned', value: '2 stars ⭐' },
            { label: 'Token ID', value: post.editions.minted + 1 },
            { label: 'Contract', value: contractAddress }
          ],
          txHash: data.transactionHash
        })
        setShowSuccessModal(true)
      } catch (error) {
        console.error('Failed to record mint:', error)
      }
    }
  })

  const handleMint = async () => {
    if (!address) {
      alert('Please connect your wallet first')
      return
    }

    if (!post.openMint) {
      alert('This post is not available for minting')
      return
    }

    // Check contract state before minting
    if (!mintingEnabled) {
      alert('Minting is currently disabled for this contract')
      return
    }

    if (totalMinted && maxSupply && totalMinted >= maxSupply) {
      alert('Maximum supply reached for this NFT')
      return
    }

    // Note: Using single contract for all posts (deploy manually later)
    // If contract address is invalid, use fallback from contract.js
    if (!contractAddress || contractAddress === '0xYourSomixNFTAddress') {
      console.warn('No custom contract address, using fallback')
      // Will use SOMIX_NFT_CONTRACT_TESTNET or SOMIX_NFT_CONTRACT_MAINNET from contract.js
    }

    if (post.editions.cap && post.editions.minted >= post.editions.cap) {
      alert('Edition cap reached')
      return
    }

    setIsPreparing(true)
    setMintError(null)

    try {
      // Prepare metadata and get token URI
      const metadataResult = await nftService.prepareMetadata(post._id)
      
      if (!metadataResult.success) {
        throw new Error(metadataResult.error || 'Failed to prepare metadata')
      }

      setTokenURI(metadataResult.tokenURI)
      setIsPreparing(false)
      
      // Use actual mint price from contract or fallback to 0.2 STT
      const actualMintPrice = mintPrice || BigInt('200000000000000000')
      
      console.log('Minting with:', {
        tokenURI: metadataResult.tokenURI,
        mintPrice: actualMintPrice.toString(),
        contractAddress
      })
      
      // Call the smart contract mint function
      // publicMint takes only uri, and requires payment
      // Note: This will trigger wallet to ask for confirmation
      mint({
        args: [metadataResult.tokenURI],
        value: actualMintPrice
      })

    } catch (error) {
      console.error('Mint error:', error)
      setMintError(error.message || 'Failed to prepare mint')
      setIsPreparing(false)
    }
  }

  const isLoading = isPreparing || isMinting || isConfirming
  const canMint = post.openMint && (!post.editions.cap || post.editions.minted < post.editions.cap) && !isConfirmed

  // Get explorer URL based on chain
  const explorerUrl = chain?.id === 5031 
    ? 'https://explorer.somnia.network' 
    : 'https://shannon-explorer.somnia.network'

  return (
    <div className="space-y-2">
      <Button
        onClick={handleMint}
        disabled={!canMint || isLoading}
        className={clsx(
          'flex items-center space-x-2 transition-all duration-300',
          canMint 
            ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white' 
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
        )}
        size="sm"
      >
        {isLoading ? (
          <>
            <Spinner size="sm" />
            <span>
              {isPreparing ? 'Preparing...' : isMinting ? 'Signing...' : isConfirming ? 'Confirming...' : 'Processing...'}
            </span>
          </>
        ) : (
          <>
            <Coins className="w-4 h-4" />
            <span>
              Mint {post.editions.minted}
              {post.editions.cap ? `/${post.editions.cap}` : ''}
            </span>
          </>
        )}
      </Button>

      {(mintError || writeError) && (
        <div className="flex items-center space-x-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{mintError || writeError?.message || 'Transaction failed'}</span>
        </div>
      )}

      {isConfirmed && mintData?.hash && (
        <div className="flex items-center space-x-2 text-green-400 text-sm">
          <CheckCircle className="w-4 h-4" />
          <span>Minted successfully!</span>
          <a
            href={`${explorerUrl}/tx/${mintData.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 hover:text-green-300"
          >
            <ExternalLink className="w-3 h-3" />
            <span>View on Explorer</span>
          </a>
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          setSuccessModalData(null)
        }}
        onContinue={() => {
          setShowSuccessModal(false)
          setSuccessModalData(null)
        }}
        {...successModalData}
      />
    </div>
  )
}