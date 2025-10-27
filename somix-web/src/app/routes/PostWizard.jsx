import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Sparkles, Wand2, Upload, Image, Tag, Eye, EyeOff, Coins, Settings, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { Button } from '../components/Button.jsx'
import { Spinner } from '../components/Spinner.jsx'
import SuccessModal from '../components/SuccessModal.jsx'
import { aiService } from '../services/ai.js'
import { ipfsService } from '../services/ipfs.js'
import { postsService } from '../services/posts.js'
import { nftService } from '../services/nft.js'
import { useWallet } from '../hooks/useWallet.js'
import { useAccount, useContractWrite, useWaitForTransaction, useNetwork, useContractRead } from 'wagmi'
import { TokenBar } from '../components/TokenBar.jsx'
import api from '../services/api.js'
import { 
  SOMIX_NFT_ABI, 
  SOMIX_NFT_CONTRACT_TESTNET, 
  SOMIX_NFT_CONTRACT_MAINNET,
  FACTORY_ABI,
  FACTORY_CONTRACT_TESTNET,
  FACTORY_CONTRACT_MAINNET,
  USER_NFT_ABI
} from '../web3/contract.js'

export function PostWizard() {
  const navigate = useNavigate()
  const { address, isConnected } = useWallet()
  const { chain } = useNetwork()
  const tokenBarRef = useRef(null)
  const [isMinting, setIsMinting] = useState(false)
  const [mintError, setMintError] = useState(null)
  const [isMintingNFT, setIsMintingNFT] = useState(false)
  const [showTopUpModal, setShowTopUpModal] = useState(false)
  
  // Get contract addresses based on chain
  const factoryAddress = chain?.id === 5031 
    ? FACTORY_CONTRACT_MAINNET 
    : FACTORY_CONTRACT_TESTNET
  
  const [currentStep, setCurrentStep] = useState(1)
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [generatedImage, setGeneratedImage] = useState(null)
  const [caption, setCaption] = useState('')
  const [tags, setTags] = useState('')
  const [visibility, setVisibility] = useState('public')
  const [openMint, setOpenMint] = useState(false) // Disabled by default until contract is installed
  const [editionCap, setEditionCap] = useState('')
  const [mintTxHash, setMintTxHash] = useState(null)
  const [userContractAddress, setUserContractAddress] = useState(null)
  const [isCreatingContract, setIsCreatingContract] = useState(false)
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successModalData, setSuccessModalData] = useState(null)
  
  // Check if factory address is valid
  const isValidFactoryAddress = factoryAddress && 
    factoryAddress !== '0xYourFactoryAddress' && 
    factoryAddress.startsWith('0x') && 
    factoryAddress.length === 42
  
  // Read user's NFT contract address from factory
  const { data: existingContract, refetch: refetchUserContract } = useContractRead({
    address: isValidFactoryAddress ? factoryAddress : undefined,
    abi: FACTORY_ABI,
    functionName: 'getUserContract',
    args: address ? [address] : undefined,
    enabled: !!address && isValidFactoryAddress,
  })
  
  // Update user contract address when we get it from factory
  useEffect(() => {
    if (existingContract && existingContract !== '0x0000000000000000000000000000000000000000') {
      setUserContractAddress(existingContract)
    }
  }, [existingContract])
  
  // Factory contract write hook for creating NFT contract
  const { 
    write: createNFTContract, 
    data: createContractData, 
    isLoading: isCreatingContractTx,
    error: createContractError 
  } = useContractWrite({
    address: isValidFactoryAddress ? factoryAddress : undefined,
    abi: FACTORY_ABI,
    functionName: 'createNFTContract',
    onSuccess: (data) => {
      console.log('Factory transaction sent:', data.hash)
    },
    onError: (error) => {
      console.error('Factory transaction error:', error)
      setMintError(error.message)
      setIsCreatingContract(false)
    }
  })
  
  // Wait for contract creation
  const { isLoading: isConfirmingContract } = useWaitForTransaction({
    hash: createContractData?.hash,
    enabled: !!createContractData?.hash,
    onSuccess: async (data) => {
      console.log('Contract created:', data)
      setIsCreatingContract(false)
      
      // Refetch user contract address
      await refetchUserContract()
      
      // Wait a bit and refetch to get the new contract address
      setTimeout(async () => {
        const { data: newContract } = await refetchUserContract()
        
        if (newContract && newContract !== '0x0000000000000000000000000000000000000000') {
          setUserContractAddress(newContract)
          
          // Store contract address for later use
          localStorage.setItem('lastContractAddress', newContract)
          
          // Continue with minting process
          const postId = localStorage.getItem('lastPostId')
          if (postId) {
            try {
              // Prepare metadata for NFT
              const metadataResult = await nftService.prepareMetadata(postId)
              
              if (metadataResult.success) {
                // Store tokenURI
                localStorage.setItem('lastTokenURI', metadataResult.tokenURI)
                
                // Call manual mint function
                // The onSuccess will be handled by useWaitForTransaction hook
                await mintNFTManually(newContract, metadataResult.tokenURI)
              }
            } catch (error) {
              console.error('Error after contract creation:', error)
              setMintError(error.message)
              setIsMinting(false)
            }
          }
        }
      }, 3000)
    }
  })

  // Wagmi hooks for NFT minting (using user's personal contract)
  const { 
    write: mintNFT, 
    data: mintData, 
    isLoading: isMintingTx,
    error: writeError 
  } = useContractWrite({
    address: userContractAddress || undefined,
    abi: USER_NFT_ABI,
    functionName: 'safeMint',
    enabled: !!userContractAddress,
    onSuccess: (data) => {
      console.log('Mint transaction sent:', data.hash)
      setMintTxHash(data.hash)
    },
    onError: (error) => {
      console.error('Mint transaction error:', error)
      setMintError(error.message)
      setIsMintingNFT(false)
    }
  })
  
  // State for manual mint contract address and tokenURI
  const [manualMintContract, setManualMintContract] = useState(null)
  const [manualMintTokenURI, setManualMintTokenURI] = useState(null)
  
  // Hook for manual mint (only enabled when contract address is set)
  const { 
    write: manualMint, 
    data: manualMintData, 
    isLoading: isManualMinting,
    error: manualMintError 
  } = useContractWrite({
    address: manualMintContract || undefined,
    abi: USER_NFT_ABI,
    functionName: 'safeMint',
    enabled: !!manualMintContract,
    onSuccess: (data) => {
      console.log('Manual mint transaction sent:', data.hash)
      setMintTxHash(data.hash)
    },
    onError: (error) => {
      console.error('Manual mint error:', error)
      setMintError(error.message)
      setIsMintingNFT(false)
      setIsMinting(false)
    }
  })
  
  // Wait for manual mint transaction
  const { isLoading: isConfirmingManualMint } = useWaitForTransaction({
    hash: manualMintData?.hash,
    enabled: !!manualMintData?.hash,
    onSuccess: async (data) => {
      console.log('Manual mint confirmed:', data)
      setIsMintingNFT(false)
      setIsMinting(false)
      
      // Record mint on backend
      const postId = localStorage.getItem('lastPostId')
      const contractAddress = manualMintContract
      
      if (postId && manualMintTokenURI && contractAddress) {
        try {
          await nftService.recordMint({
            postId: postId,
            tokenURI: manualMintTokenURI,
            txHash: data.transactionHash,
            tokenId: 1,
            contractAddress: contractAddress,
            minter: address
          })
        } catch (error) {
          console.error('Failed to record mint:', error)
        }
      }
      
      // Show success modal
      setSuccessModalData({
        type: 'mint',
        title: '🎉 Post Published & NFT Minted!',
        message: 'Your post has been published and NFT has been successfully minted to your personal collection.',
        details: [
          { label: 'Post ID', value: postId },
          { label: 'NFT Contract', value: contractAddress },
          { label: 'Token URI', value: manualMintTokenURI }
        ],
        txHash: data.transactionHash
      })
      setShowSuccessModal(true)
    }
  })
  
  // Function to manually mint NFT
  const mintNFTManually = async (contractAddress, tokenURI) => {
    // Validate address is available
    if (!address) {
      throw new Error('Wallet address is not available. Please ensure your wallet is connected.')
    }
    
    console.log('🔍 Manual mint with:', { contractAddress, tokenURI, address })
    
    // Set state to enable the hook and trigger mint
    setManualMintContract(contractAddress)
    setManualMintTokenURI(tokenURI)
    
    // The actual mint will be triggered by useEffect below
  }
  
  // Effect to trigger manual mint when contract and tokenURI are set
  useEffect(() => {
    if (manualMintContract && manualMintTokenURI && manualMint && address) {
      console.log('✅ Manual mint hook ready, calling mint...')
      try {
        manualMint({
          args: [address, manualMintTokenURI]
        })
        // Clear the state to prevent re-triggering
        setManualMintTokenURI(null)
      } catch (error) {
        console.error('❌ Manual mint call failed:', error)
        setMintError(error.message)
        setIsMintingNFT(false)
        setIsMinting(false)
      }
    }
  }, [manualMintContract, manualMintTokenURI, manualMint, address])

  // Wait for mint transaction confirmation
  const { isLoading: isConfirmingMint } = useWaitForTransaction({
    hash: mintData?.hash,
    enabled: !!mintData?.hash,
    onSuccess: async (data) => {
      console.log('Mint confirmed:', data)
      setIsMintingNFT(false)
      setIsMinting(false)
      
      // Record mint on backend
      try {
        // Get postId and contractAddress from recent post creation
        const postId = localStorage.getItem('lastPostId')
        const contractAddress = localStorage.getItem('lastContractAddress') || userContractAddress
        const tokenURI = localStorage.getItem('lastTokenURI')
        
        if (postId && contractAddress) {
          await nftService.recordMint({
            postId: postId,
            tokenURI: tokenURI,
            txHash: data.transactionHash,
            tokenId: 1,
            contractAddress: contractAddress,
            minter: address
          })
          localStorage.removeItem('lastPostId')
          localStorage.removeItem('lastTokenURI')
          localStorage.removeItem('lastContractAddress')
        }
      } catch (error) {
        console.error('Failed to record mint:', error)
      }
      
      // Show success modal
      const postId = localStorage.getItem('lastPostId')
      const contractAddress = localStorage.getItem('lastContractAddress') || userContractAddress
      const tokenURI = localStorage.getItem('lastTokenURI')
      
      setSuccessModalData({
        type: 'mint',
        title: '🎉 Post Published & NFT Minted!',
        message: 'Your post has been published and NFT has been successfully minted to your personal collection.',
        details: [
          { label: 'Post ID', value: postId || 'N/A' },
          { label: 'NFT Contract', value: contractAddress || 'N/A' },
          { label: 'Token URI', value: tokenURI || 'N/A' }
        ],
        txHash: data.transactionHash
      })
      setShowSuccessModal(true)
    }
  })

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    
    // Check if user has enough tokens
    try {
      const tokenResponse = await api.get(`/tokens/${address}`)
      const userTokens = tokenResponse.data.tokens
      
      if (userTokens < 20) {
        // Show beautiful top-up modal
        setShowTopUpModal(true)
        return
      }
    } catch (error) {
      console.error('Failed to check tokens:', error)
      setShowTopUpModal(true)
      return
    }
    
    setIsGenerating(true)
    try {
      console.log('Generating image for prompt:', prompt)
      
      // Generate AI image only (no IPFS upload yet)
      const aiResult = await aiService.generateImage(prompt)
      console.log('AI generation result:', aiResult)
      
      if (aiResult.success && aiResult.imageUrl) {
        console.log('AI generation successful, storing image URL for later upload')
        
        // Deduct tokens after successful generation
        try {
          const deductResponse = await api.post('/tokens/deduct', {
            address: address,
            amount: 20
          })
          console.log('Tokens deducted:', deductResponse.data)
          
          // Refresh token bar immediately
          if (tokenBarRef.current) {
            tokenBarRef.current.refreshTokens()
          }
        } catch (error) {
          console.error('Failed to deduct tokens:', error)
          // Continue anyway - tokens were already validated
        }
        
        // Store the AI-generated image URL (will upload to IPFS in step 2)
        setGeneratedImage({
          url: aiResult.imageUrl,
          thumbUrl: aiResult.imageUrl,
          cid: null,
          blurHash: null,
          needsUpload: true // Flag to indicate this needs IPFS upload
        })
        console.log('Image generated successfully, ready for step 2')
      } else {
        console.error('AI generation failed:', aiResult.error)
        alert(`Failed to generate image: ${aiResult.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error generating image:', error)
      alert(`An error occurred: ${error.message || 'Please try again'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleNext = async () => {
    if (!generatedImage) return
    
    setIsUploading(true)
    
    try {
      // If image needs IPFS upload, do it now
      if (generatedImage.needsUpload) {
        console.log('Uploading image to IPFS before proceeding to step 2...')
        const ipfsResult = await ipfsService.uploadFromUrl(generatedImage.url)
        console.log('IPFS upload result:', ipfsResult)
        
        if (ipfsResult.success) {
          // Update with IPFS data
          setGeneratedImage({
            url: ipfsResult.gatewayUrl,
            thumbUrl: ipfsResult.thumbUrl,
            cid: ipfsResult.cid,
            blurHash: ipfsResult.blurHash,
            needsUpload: false
          })
          console.log('IPFS upload successful, proceeding to step 2')
        } else {
          console.error('IPFS upload failed, using direct URL:', ipfsResult.error)
          // Keep using direct URL with proper fallback values
          setGeneratedImage({
            ...generatedImage,
            thumbUrl: generatedImage.url, // Use main URL as thumbnail
            blurHash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj', // Default blur hash
            needsUpload: false
          })
        }
      }
      
      setCurrentStep(2)
    } catch (error) {
      console.error('Error uploading to IPFS:', error)
      // Keep using direct URL with proper fallback values
      setGeneratedImage({
        ...generatedImage,
        thumbUrl: generatedImage.url, // Use main URL as thumbnail
        blurHash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj', // Default blur hash
        needsUpload: false
      })
      setCurrentStep(2)
    } finally {
      setIsUploading(false)
    }
  }

  const handlePublish = async () => {
    if (!caption.trim() || !generatedImage) return
    
    // Debug logging
    console.log('🔍 Publishing post with:', { 
      isConnected, 
      address, 
      caption: caption.trim(),
      hasImage: !!generatedImage 
    })
    
    // Check if wallet is connected
    if (!isConnected || !address) {
      console.error('❌ Wallet not connected:', { isConnected, address })
      alert('Please connect your wallet first')
      return
    }
    
    setIsMinting(true)
    setMintError(null)
    
    try {
      // Ensure user is registered before creating post
      if (!address) {
        console.error('❌ Address is undefined during registration check')
        throw new Error('Wallet address is not available. Please reconnect your wallet.')
      }
      
      try {
        console.log('🔄 Ensuring user is registered:', address)
        const regResponse = await api.post('/users/register', { address })
        console.log('✅ User registration confirmed:', regResponse.data)
      } catch (regError) {
        console.log('⚠️ Registration check failed:', regError.response?.data || regError.message)
        // Continue anyway, might be existing user
      }
      
      // Final validation before creating post
      if (!address || typeof address !== 'string' || !address.startsWith('0x')) {
        console.error('❌ Invalid address format:', { address, type: typeof address })
        throw new Error('Invalid wallet address format. Please reconnect your wallet.')
      }
      
      // Step 1: Create the post
      // Ensure image data has required fields with fallback values
      const imageData = {
        cid: generatedImage.cid || 'fallback',
        url: generatedImage.url,
        thumbUrl: generatedImage.thumbUrl || generatedImage.url,
        blurHash: generatedImage.blurHash || 'LEHV6nWB2yk8pyo0adR*.7kCMdnj'
      }
      
      console.log('🖼️ Image data for post:', imageData)
      
      const postData = {
        authorAddress: address,
        caption: caption.trim(),
        prompt: prompt.trim(),
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        visibility: visibility,
        openMint: openMint,
        editions: {
          cap: editionCap ? parseInt(editionCap) : null,
          minted: 0
        },
        image: imageData
      }

      const result = await postsService.createPost(postData)

      if (!result.success) {
        throw new Error(result.error || 'Failed to publish post')
      }

      console.log('Post created successfully:', result.postId)
      
      // Store postId for later use
      localStorage.setItem('lastPostId', result.postId)

      // Step 2: If openMint is enabled, prepare and mint NFT
      if (openMint) {
        // Check if factory is deployed
        if (!isValidFactoryAddress) {
          setIsMinting(false)
          alert('⚠️ Factory contract not deployed yet! Post published successfully.\n\nTo enable NFT minting, please deploy the Factory contract first.')
          window.location.href = '/'
          return
        }

        try {
          setIsMintingNFT(true)
          
          // Check if user has personal NFT contract
          if (!userContractAddress) {
            // User doesn't have contract yet, create one
            setIsCreatingContract(true)
            console.log('🏭 Creating personal NFT collection for user:', address)
            
            // Call factory to create NFT contract for user
            createNFTContract({
              args: [address]
            })
            
            // Wait for contract creation, then mint will happen in onSuccess callback
            return
          }
          
          // User has contract, proceed with minting
          // Prepare metadata for NFT
          const metadataResult = await nftService.prepareMetadata(result.postId)
          
          if (!metadataResult.success) {
            throw new Error(metadataResult.error || 'Failed to prepare NFT metadata')
          }

          console.log('Metadata prepared:', metadataResult.tokenURI)

          // Store postId, tokenURI, and contractAddress for later use in onSuccess callback
          localStorage.setItem('lastPostId', result.postId)
          localStorage.setItem('lastTokenURI', metadataResult.tokenURI)
          localStorage.setItem('lastContractAddress', userContractAddress)

          // Call smart contract to mint NFT to user's personal collection
          // This will trigger wallet confirmation dialog
          mintNFT({
            args: [address, metadataResult.tokenURI]
          })

          // Note: The wallet will now ask for confirmation
          // Once confirmed, onSuccess callback will handle redirect
          
        } catch (error) {
          console.error('NFT minting error:', error)
          setMintError(error.message)
          setIsMintingNFT(false)
          setIsMinting(false)
          setIsCreatingContract(false)
          // Still show success for post creation
          alert('Post published, but NFT minting failed: ' + error.message)
          window.location.href = '/'
        }
      } else {
        // No NFT minting, just redirect
        setIsMinting(false)
        // Show success modal
        setSuccessModalData({
          type: 'post',
          title: '✨ Post Published!',
          message: 'Your post has been successfully published and is now visible to everyone.',
          details: [
            { label: 'Post ID', value: result.postId },
            { label: 'Visibility', value: 'Public' },
            { label: 'NFT Minting', value: 'Disabled' }
          ]
        })
        setShowSuccessModal(true)
      }

    } catch (error) {
      console.error('Error publishing post:', error)
      alert('Failed to publish post: ' + error.message)
      setIsMinting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text">Create Post</h1>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-400">
              Step {currentStep} of 2
            </div>
            <div className="w-24 h-2 bg-white/10 rounded-full">
              <div 
                className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 2) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Token Bar */}
        <TokenBar ref={tokenBarRef} />
        
        {currentStep === 1 ? (
          <Step1Generate 
            prompt={prompt}
            setPrompt={setPrompt}
            isGenerating={isGenerating}
            generatedImage={generatedImage}
            onGenerate={handleGenerate}
            onNext={handleNext}
            isUploading={isUploading}
          />
        ) : (
          <Step2Details 
            generatedImage={generatedImage}
            caption={caption}
            setCaption={setCaption}
            tags={tags}
            setTags={setTags}
            visibility={visibility}
            setVisibility={setVisibility}
            openMint={openMint}
            setOpenMint={setOpenMint}
            editionCap={editionCap}
            setEditionCap={setEditionCap}
            onPublish={handlePublish}
            onBack={() => setCurrentStep(1)}
            isConnected={isConnected}
            address={address}
            isMinting={isMinting}
            isMintingNFT={isMintingNFT}
            isMintingTx={isMintingTx}
            isConfirmingMint={isConfirmingMint}
            mintError={mintError}
            mintTxHash={mintTxHash}
            isValidContractAddress={isValidFactoryAddress}
            isCreatingContract={isCreatingContract}
            isCreatingContractTx={isCreatingContractTx}
            isConfirmingContract={isConfirmingContract}
            userContractAddress={userContractAddress}
          />
        )}
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          setSuccessModalData(null)
          window.location.href = '/'
        }}
        onContinue={() => {
          setShowSuccessModal(false)
          setSuccessModalData(null)
          window.location.href = '/'
        }}
        {...successModalData}
      />

      {/* Top Up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowTopUpModal(false)}
          />
          
          {/* Modal */}
          <div className="relative glass-effect rounded-3xl p-8 max-w-md w-full animate-bounce-in shadow-2xl border border-purple-500/30">
            {/* Close button */}
            <button
              onClick={() => setShowTopUpModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
                <Coins className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-center text-white mb-2">
              Out of Tokens!
            </h2>
            <p className="text-center text-gray-400 mb-6">
              You need at least <span className="text-purple-400 font-bold">20 tokens</span> to generate an image. Top up now to continue creating!
            </p>

            {/* Top up button */}
            <button
              onClick={() => {
                setShowTopUpModal(false)
                navigate('/topup')
              }}
              className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-xl shadow-purple-500/50 flex items-center justify-center space-x-2"
            >
              <Coins className="w-5 h-5" />
              <span>Top Up Tokens</span>
              <span className="text-2xl">→</span>
            </button>

            {/* Info */}
            <p className="text-sm text-center text-gray-500 mt-4">
              New users get <span className="text-green-400 font-bold">100 free tokens</span> on first top-up!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function Step1Generate({ prompt, setPrompt, isGenerating, generatedImage, onGenerate, onNext, isUploading }) {
  return (
    <div className="space-y-6">
      {/* Prompt Input */}
      <div className="glass-effect rounded-3xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
            <Wand2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">AI Image Generation</h2>
            <p className="text-gray-400">Describe what you want to create</p>
          </div>
        </div>

        <div className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A majestic dragon flying over a neon-lit cyberpunk city at sunset, digital art style..."
            className="w-full h-32 px-4 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 resize-none"
          />
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {prompt.length}/500 characters
            </div>
            <Button 
              onClick={onGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-3 rounded-2xl transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Image</span>
                  <div className="ml-2 flex items-center space-x-1 bg-white/20 px-2 py-1 rounded-lg">
                    <Coins className="w-4 h-4" />
                    <span className="text-sm font-bold">20</span>
                  </div>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="glass-effect rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Preview</h3>
          
          {/* Next Button - Next to Preview title */}
          {generatedImage && !isGenerating && (
            <Button
              onClick={onNext}
              disabled={isUploading}
              className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isUploading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <span>Next: Add Details</span>
                  <span className="text-xl animate-pulse">→</span>
                </>
              )}
            </Button>
          )}
        </div>
        
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mb-6 animate-pulse">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <Spinner size="lg" />
            <p className="text-gray-400 mt-4">AI is creating your masterpiece...</p>
            <div className="mt-4 text-sm text-gray-500">
              This may take 10-30 seconds
            </div>
          </div>
                ) : generatedImage ? (
                  <div className="relative">
                    <img
                      src={generatedImage.thumbUrl || generatedImage.url}
                      alt="Generated AI art"
                      className="w-full h-96 object-cover rounded-2xl shadow-2xl"
                    />
                  </div>
                ) : (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/20 rounded-2xl">
            <div className="w-16 h-16 bg-gradient-to-r from-gray-600 to-gray-700 rounded-2xl flex items-center justify-center mb-4">
              <Image className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-400 mb-2">No Image Yet</h4>
            <p className="text-gray-500 text-center max-w-md">
              Enter a prompt above and click "Generate Image" to create your AI artwork
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function Step2Details({ 
  generatedImage, 
  caption, 
  setCaption, 
  tags, 
  setTags, 
  visibility, 
  setVisibility, 
  openMint, 
  setOpenMint, 
  editionCap, 
  setEditionCap, 
  onPublish, 
  onBack,
  isConnected,
  address,
  isMinting,
  isMintingNFT,
  isMintingTx,
  isConfirmingMint,
  mintError,
  mintTxHash,
  isValidContractAddress,
  isCreatingContract,
  isCreatingContractTx,
  isConfirmingContract,
  userContractAddress
}) {
  return (
    <div className="space-y-6">
      {/* Image Preview */}
      <div className="glass-effect rounded-3xl p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Post Details</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <img
              src={generatedImage.thumbUrl || generatedImage.url}
              alt="Generated AI art"
              className="w-full h-64 object-cover rounded-2xl"
            />
          </div>
          
          <div className="space-y-4">
            {/* Caption */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Caption *
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Describe your creation..."
                className="w-full h-24 px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 resize-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tags
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="ai, art, digital, cyberpunk..."
                  className="w-full pl-10 pr-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                />
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Visibility
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setVisibility('public')}
                  className={clsx(
                    'flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300',
                    visibility === 'public'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  )}
                >
                  <Eye className="w-4 h-4 inline mr-2" />
                  Public
                </button>
                <button
                  onClick={() => setVisibility('followers')}
                  className={clsx(
                    'flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300',
                    visibility === 'followers'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  )}
                >
                  <EyeOff className="w-4 h-4 inline mr-2" />
                  Followers Only
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NFT Settings */}
      <div className="glass-effect rounded-3xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
            <Coins className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">NFT Settings</h3>
            <p className="text-gray-400">Configure blockchain minting options</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Open Mint Toggle */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div>
              <h4 className="font-semibold text-white">Allow NFT Minting</h4>
              <p className="text-sm text-gray-400">Let others mint NFTs from your creation</p>
            </div>
            <button
              onClick={() => setOpenMint(!openMint)}
              className={clsx(
                'w-12 h-6 rounded-full transition-all duration-300',
                openMint ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-600'
              )}
            >
              <div className={clsx(
                'w-5 h-5 bg-white rounded-full transition-all duration-300',
                openMint ? 'translate-x-6' : 'translate-x-0.5'
              )} />
            </button>
          </div>

          {/* Edition Cap */}
          {openMint && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Edition Cap (Optional)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={editionCap}
                  onChange={(e) => setEditionCap(e.target.value)}
                  placeholder="Leave empty for unlimited"
                  className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Maximum number of NFTs that can be minted from this post
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Wallet Status */}
      {!isConnected && (
        <div className="glass-effect rounded-3xl p-4 bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-sm text-yellow-400 text-center">
            ⚠️ Please connect your wallet to publish posts
          </p>
        </div>
      )}

      {/* Factory Not Deployed Warning */}
      {openMint && !isValidContractAddress && (
        <div className="glass-effect rounded-3xl p-4 bg-orange-500/10 border border-orange-500/20">
          <p className="text-sm text-orange-400 text-center mb-2">
            ⚠️ Factory contract not deployed yet. Posts will be published without NFT minting.
          </p>
          <p className="text-xs text-orange-300 text-center">
            💡 Deploy the Factory contract first (see DEPLOY_FACTORY_CONTRACT.md)
          </p>
          <p className="text-xs text-orange-300 text-center mt-1">
            ✨ After deployed, your personal NFT collection will be created automatically when you publish your first post!
          </p>
        </div>
      )}



      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="px-6 py-3"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Generation
        </Button>
        
        <Button 
          onClick={onPublish}
          disabled={!caption.trim() || !isConnected || isMinting}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-3 rounded-2xl transition-all duration-300 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isMinting ? (
            <>
              <Spinner size="sm" className="mr-2" />
              {isCreatingContract || isCreatingContractTx ? 'Creating Collection...' : 
               isConfirmingContract ? 'Confirming Collection...' : 
               isMintingNFT || isMintingTx ? 'Confirm in Wallet...' : 
               isConfirmingMint ? 'Confirming Mint...' : 
               'Publishing...'}
            </>
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              Publish Post
            </>
          )}
        </Button>
      </div>
      {!caption.trim() && (
        <p className="text-sm text-yellow-400 mt-2 text-center">
          * Please enter a caption to publish
        </p>
      )}
      {mintError && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-sm text-red-400">
            ⚠️ {mintError}
          </p>
        </div>
      )}
      {mintTxHash && (
        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <p className="text-sm text-green-400">
            ✅ Transaction sent! Hash: {mintTxHash.slice(0, 10)}...
          </p>
        </div>
      )}
    </div>
  )
}