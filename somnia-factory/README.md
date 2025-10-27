# Somix NFT Factory - Deployment Project

## 📖 Overview

This project deploys a Factory contract that creates personal NFT collections for each Somix user.

## 🎯 What This Does

- Creates **one NFT collection per user** automatically
- Users get their own collection when they publish their first post
- Each collection is owned by the user who created it

## 🚀 Quick Deploy

See `DEPLOY_NOW.md` for step-by-step instructions.

## 📁 Files

- `contracts/SomixNFTFactory.sol` - Factory and NFT template contracts
- `ignition/modules/Factory.ts` - Deployment configuration
- `hardhat.config.ts` - Hardhat configuration
- `DEPLOY_NOW.md` - Deployment guide
- `GET_PRIVATE_KEY.md` - How to get your private key

## ⚡ Quick Start

```bash
# 1. Create .env file with your private key
# 2. Deploy factory
npx hardhat ignition deploy ignition/modules/Factory.ts --network somnia

# 3. Copy the deployed address and update in frontend
```

## 🔗 After Deployment

Update the factory address in:
`somix-web/src/app/web3/contract.js`

```javascript
export const FACTORY_CONTRACT_TESTNET = '0xYourDeployedFactoryAddress'
```

