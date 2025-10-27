// Utility untuk deploy NFT contract secara manual
// Untuk saat ini, kita akan menggunakan approach yang lebih simple:
// Deploy NFT contract dari hardhat ketika user publish post pertama kali

import { ethers } from 'ethers'

export async function deployNFTContract(
  caption,
  signer,
  mintPrice = '0.2',
  maxSupply = 1000
) {
  try {
    console.log('🚀 Deploying NFT contract...')
    console.log('Caption:', caption)
    console.log('Mint Price:', mintPrice)
    console.log('Max Supply:', maxSupply)
    
    // Generate symbol from caption
    const symbol = caption
.slice(0, 6)
.toUpperCase()
.replace(/[^A-Z0-9]/g, '')
    
    // Get contract factory
    const response = await fetch('/api/deploy-nft', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        caption,
        symbol,
        mintPrice,
        maxSupply,
        deployer: await signer.getAddress()
      })
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('✅ NFT contract deployed:', result.contractAddress)
      return {
        success: true,
        contractAddress: result.contractAddress,
        symbol
      }
    } else {
      throw new Error(result.error || 'Failed to deploy NFT contract')
    }
  } catch (error) {
    console.error('❌ NFT deployment error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Fallback: Deploy directly using ethers (requires ABI & bytecode)
export async function deployNFTContractDirect(
  caption,
  signer,
  mintPrice = '0.2',
  maxSupply = 1000
) {
  try {
    // This will be implemented when we have the contract compiled
    // For now, return mock data
    return {
      success: false,
      error: 'Direct deployment not implemented yet. Please deploy manually via Hardhat.'
    }
  } catch (error) {
    console.error('Direct deployment error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

