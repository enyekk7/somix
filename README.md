# 🌟 SOMIX - AI Social Media Platform with NFT Minting

![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)

**SOMIX** is an AI-powered social media platform with blockchain integration that enables users to create AI art, share it on social feeds, and monetize their creations through NFTs on Somnia Network.

## 📌 Table of Contents

- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Smart Contracts](#-smart-contracts)
- [Wallet Addresses](#-wallet-addresses)
- [API Endpoints](#-api-endpoints)
- [How It Works](#-how-it-works)
- [Installation](#-installation)
- [Tech Stack](#-tech-stack)

## 🎯 Features

- 🤖 **AI Art Generation** - Generate images using DeepAI API
- 🖼️ **IPFS Storage** - Decentralized storage via Pinata
- 🎨 **NFT Minting** - Mint NFTs with ERC-721 standard
- 💰 **Monetization** - Creators earn income from each mint
- 🌐 **Web3 Integration** - MetaMask, RainbowKit, WalletConnect
- 📱 **Real-time Notifications** - WebSocket notifications
- 🎯 **Mission System** - Complete missions & earn rewards
- 👑 **SomixPro** - Premium subscription features
- ⭐ **Stars System** - Rewards for NFT creators
- 🔍 **Search** - Search posts, users, tags
- ❤️ **Social Features** - Like, follow, comment
- 💸 **Withdraw Stars** - Convert stars to STT (0.1 STT per star)

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    SOMIX PLATFORM                             │
└──────────────────────┬───────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼─────────┐         ┌─────────▼─────────┐
│  FRONTEND       │         │  BACKEND           │
│  (Vercel)       │         │  (Railway)         │
│                 │         │                    │
│  • React + Vite │         │  • Node.js         │
│  • Wagmi        │         │  • Express         │
│  • RainbowKit   │         │  • MongoDB         │
│  • TailwindCSS  │         │  • WebSocket       │
└───────┬─────────┘         └─────────┬──────────┘
        │                             │
        │  HTTP/WebSocket             │  Blockchain Calls
        │                             │
┌───────▼─────────────────────────────▼──────────────┐
│            BLOCKCHAIN (Somnia Network)             │
│                                                    │
│  • SomixNFT.sol (ERC-721)                         │
│  • Mint Price: 0.2 STT                            │
│  • Max Supply: 1000                               │
│  • Network: Somnia Testnet (Chain ID: 50312)      │
└────────────────────────────────────────────────────┘
```

## 📦 Smart Contracts

### 1. SomixNFT.sol (ERC-721)

**Location**: `somnia-factory/contracts/SomixNFT.sol`

**Address**: 
- Testnet: `0x7580821e9C967Ce11c044ad95a911421eF62a604`
- Explorer: https://shannon-explorer.somnia.network/address/0x7580821e9C967Ce11c044ad95a911421eF62a604

**Features**:
```solidity
contract SomixNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 public mintPrice = 200000000000000000;  // 0.2 STT (wei)
    uint256 public maxSupply = 1000;                // Max NFTs
    bool public mintingEnabled = true;              // Enable minting
    uint256 public totalMinted;                      // Current minted count
    
    // Public mint - Anyone can mint by paying
    function publicMint(string memory uri) 
        public 
        payable 
        returns (uint256) 
    {
        require(mintingEnabled, "Minting disabled");
        require(msg.value >= mintPrice, "Insufficient payment");
        require(totalMinted < maxSupply, "Max supply reached");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);  // ← Mint to buyer's wallet
        _setTokenURI(tokenId, uri);
        totalMinted++;
        
        return tokenId;
    }
    
    // Owner withdraw - Withdraw funds from contract
    function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
```

**Main Functions**:
| Function | Description | Access |
|----------|-------------|--------|
| `publicMint(uri)` | Mint NFT with 0.2 STT payment | Public |
| `safeMint(to, uri)` | Free mint for owner | Owner only |
| `setMintPrice(price)` | Update mint price | Owner only |
| `setMintingEnabled(enabled)` | Enable/disable minting | Owner only |
| `withdraw()` | Withdraw funds from contract | Owner only |
| `totalMinted()` | View total NFTs minted | View |
| `mintPrice()` | View mint price | View |

**Contract Addresses**:
- **Testnet**: `0x7580821e9C967Ce11c044ad95a911421eF62a604`
- **Owner**: Wallet with private key stored in env
- **Network**: Somnia Testnet (Chain ID: 50312)

---

### 2. SomixNFTFactory.sol

**Location**: `somnia-factory/contracts/SomixNFTFactory.sol`

**Address**: 
- Testnet: `0x71dc7Ab62cC0A4C79eb28c28cc33e24988E19f6e`
- Explorer: https://shannon-explorer.somnia.network/address/0x71dc7Ab62cC0A4C79eb28c28cc33e24988E19f6e

**Functions**:
```solidity
contract SomixNFTFactory {
    mapping(address => address) public userContracts;
    
    // Create NFT collection for user
    function createNFTContract(address user) 
        external 
        returns (address) 
    {
        // Deploy new contract for user
        UserNFTCollection newContract = new UserNFTCollection(...);
        userContracts[user] = address(newContract);
        return address(newContract);
    }
    
    // Get user's contract
    function getUserContract(address user) 
        external 
        view 
        returns (address) 
    {
        return userContracts[user];
    }
}
```

---

## 💼 Wallet Addresses

### Developer/Payment Wallet

```
Address: 0x862C8f5C105981d88675A4825ae9a7E62103ae39
Network: Somnia Testnet (Chain ID: 50312)
Purpose: 
  • Receive Top Up payments (5, 12, 18 STT)
  • Receive SomixPro payments (0.5 SOMI)
  • Send withdraw stars to users (0.1 STT per star)
```

**Balance**: Check at https://shannon-explorer.somnia.network/address/0x862C8f5C105981d88675A4825ae9a7E62103ae39

---

## 🔄 How the System Works

### 1️⃣ **Create Post Flow**

```
User Input (PostWizard)
    ↓
1. Check tokens ≥ 1
    ↓
2. Generate AI Image
   • Call DeepAI API
   • Get image URL
    ↓
3. Upload to IPFS (Pinata)
   • Upload image
   • Get CID (IPFS hash)
   • Generate blurHash
   • Create thumbnail
    ↓
4. Save to MongoDB
   • Auto-create User (if not exists)
   • Create Post document
   • Deduct 1 token
    ↓
5. Display in Feed
```

---

### 2️⃣ **Mint NFT Flow**

```
User Click "Mint NFT"
    ↓
1. Prepare Metadata
   • POST /api/mints/prepare-metadata-for-post
   • Get post data
   • Create NFT metadata JSON
   • Upload to IPFS
   • Return tokenURI
    ↓
2. Blockchain Transaction
   • Connect to SomixNFT contract
   • Call publicMint(tokenURI)
   • User pay 0.2 STT
   • Sign transaction in MetaMask
    ↓
3. Smart Contract Execution
   contract SomixNFT {
       publicMint(uri) {
           require(msg.value >= 0.2 STT)
           uint256 tokenId = _nextTokenId++;
           _safeMint(msg.sender, tokenId)  ← Send to user's wallet
           _setTokenURI(tokenId, uri)
           totalMinted++
       }
   }
    ↓
4. Save Mint Record
   • POST /api/mints/record
   • Create Mint document
   • Increment post.editions.minted
   • Create notification
    ↓
5. Reward Creator
   • POST /api/stars/add
   • Creator receives 2 stars ⭐
   • Stars can be withdrawn as STT
```

**Why mint to user's wallet?**
- `msg.sender` is the wallet address that performs the mint
- NFT is sent via `_safeMint(msg.sender, tokenId)` to that wallet
- 0.2 STT goes to contract owner
- Creator receives 2 ⭐

---

### 3️⃣ **Stars System & Withdraw**

**Why users receive stars?**

```
ECONOMIC FLOW:
┌────────────────────────────────────────┐
│  User B mints NFT from User A's post  │
│  ↓                                     │
│  Pay: 0.2 STT                         │
│  ↓                                     │
│  0.2 STT goes to NFT Contract Owner  │
│  ↓                                     │
│  Creator (User A) gets 2 stars ⭐⭐ │
│  ↓                                     │
│  1 star = 0.1 STT                    │
│  2 stars = 0.2 STT                   │
└────────────────────────────────────────┘
```

**Reasons**:
- ✅ Reward creator for quality content
- ✅ Monetization from NFT minting
- ✅ Leaderboard (top creators)
- ✅ Real income: stars → STT

**Stars = Commission for Creators**:
- Every NFT mint = 2 stars for creator
- 1 star = 0.1 STT withdrawable
- Creator profits from every mint

---

### 4️⃣ **Withdraw Stars Flow**

```
User Request Withdraw
    ↓
POST /api/stars/withdraw
{
  address: "0x...",
  starsToWithdraw: 50
}
    ↓
Backend Validation:
  ✅ Check user.stars >= 50?
  ✅ Calculate: 50 × 0.1 = 5.0 STT
  ✅ Check wallet balance >= 5.0 STT?
    ↓
Blockchain Transfer:
  From: 0x862C...3ae39 (Developer Wallet)
  To: User Wallet Address
  Amount: 5.0 STT
    ↓
Database Update:
  user.stars: 50 → 0
  user.totalStarsWithdrawn: +50
    ↓
Success! ✅
  User receives 5.0 STT
  Transaction hash: 0xABC...
```

---

## 📡 API Endpoints

### Backend URL
```
Production: https://somix-production.up.railway.app/api
Network: Somnia Testnet (Chain ID: 50312)
```

### Endpoints

#### **Posts**
```http
GET    /api/posts              # Get all posts
POST   /api/posts              # Create post
GET    /api/posts/:id          # Get single post
POST   /api/posts/:id/like     # Like post
DELETE /api/posts/:id          # Delete post
```

#### **AI Generation**
```http
POST /api/ai/generate
Request: { prompt, style }
Response: { image: { url, cid, blurHash, thumbUrl } }
```

#### **IPFS Upload**
```http
POST /api/ipfs/upload-from-url
Request: { url }
Response: { cid, url, thumbUrl, blurHash }
```

#### **NFT Minting**
```http
POST /api/mints/prepare-metadata-for-post
Request: { postId }
Response: { tokenURI }

POST /api/mints/record
Request: { postId, tokenURI, txHash, tokenId, contractAddress, minter }
```

#### **Stars System**
```http
GET  /api/stars/:address           # Get stars balance
POST /api/stars/add                 # Add stars to creator
POST /api/stars/withdraw            # Withdraw stars (convert to STT)
GET  /api/stars/wallet-balance      # Check developer wallet balance
```

#### **Missions**
```http
GET  /api/missions/progress/:address    # Get mission progress
POST /api/missions/claim/:address/:id    # Claim mission reward
POST /api/missions/checkin/:address      # Daily check-in
```

#### **User Management**
```http
POST   /api/users/register         # Register user
GET    /api/users/:address         # Get user data
GET    /api/users/:address/posts   # Get user posts
GET    /api/users/:address/minted   # Get user mints
```

#### **Search**
```http
GET /api/search?q=keyword          # Search posts
GET /api/search/users?q=keyword    # Search users
GET /api/search/tags?q=keyword     # Search tags
```

#### **Notifications**
```http
GET  /api/notifications?address=0x...        # Get notifications
GET  /api/notifications/unread-count         # Get unread count
POST /api/notifications/read/:id             # Mark as read
```

#### **SomixPro**
```http
POST /api/somixpro/subscribe       # Subscribe to Pro
GET  /api/somixpro/status/:address # Check Pro status
```

#### **Tokens**
```http
POST /api/tokens/topup             # Top up tokens
GET  /api/tokens/:address          # Get token balance
```

---

## 💻 Tech Stack

### **Frontend** (`somix-web/`)
```json
{
  "framework": "React 18 + Vite",
  "web3": {
    "wagmi": "^1.4.13",
    "rainbowkit": "^1.3.7",
    "viem": "^6.15.0"
  },
  "styling": "TailwindCSS",
  "state": "@tanstack/react-query",
  "routing": "react-router-dom v6"
}
```

### **Backend** (`somix-api/`)
```json
{
  "runtime": "Node.js + Express",
  "database": "MongoDB Atlas",
  "realtime": "WebSocket",
  "storage": "Pinata (IPFS)",
  "ai": "DeepAI API",
  "security": "helmet, cors, rate-limit"
}
```

### **Blockchain**
```json
{
  "network": "Somnia Testnet",
  "chainId": 50312,
  "rpc": "https://dream-rpc.somnia.network",
  "explorer": "https://shannon-explorer.somnia.network",
  "contracts": {
    "SomixNFT": "0x7580821e9C967Ce11c044ad95a911421eF62a604",
    "Factory": "0x71dc7Ab62cC0A4C79eb28c28cc33e24988E19f6e"
  }
}
```

---

## 📁 Project Structure

```
somix/
├── somix-web/              # Frontend (React + Vite)
│   ├── src/
│   │   ├── app/
│   │   │   ├── routes/      # Pages (Home, Profile, etc)
│   │   │   ├── components/  # Reusable components
│   │   │   ├── services/    # API services
│   │   │   ├── hooks/       # Custom hooks
│   │   │   └── web3/        # Blockchain config
│   │   └── hooks/           # Global hooks
│   ├── package.json
│   └── vite.config.js
│
├── somix-api/               # Backend (Express)
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── models/          # MongoDB schemas
│   │   ├── services/        # Business logic
│   │   └── index.js         # Server entry
│   ├── Procfile             # Railway config
│   └── railway.json
│
├── somnia-factory/         # Smart Contracts
│   ├── contracts/
│   │   ├── SomixNFT.sol     # Main NFT contract
│   │   └── SomixNFTFactory.sol
│   ├── scripts/             # Deploy scripts
│   └── hardhat.config.ts
│
└── api-lib/                 # Shared backend code
    ├── models/
    ├── routes/
    └── services/
```

---

## 🔐 Smart Contract Details

### Contract Information

**SomixNFT Contract**:
```
Address:      0x7580821e9C967Ce11c044ad95a911421eF62a604
Network:      Somnia Testnet
Chain ID:     50312
Owner:        Wallet with private key in env
Mint Price:   0.2 STT (wei: 200000000000000000)
Max Supply:   1000 NFTs
```

**Verification**:
- ✅ Contract deployed & verified
- ✅ OpenZeppelin audited contracts
- ✅ Owner controls: mintPrice, mintingEnabled
- ✅ Funds can be withdrawn by owner only

**Check Contract**: https://shannon-explorer.somnia.network/address/0x7580821e9C967Ce11c044ad95a911421eF62a604

---

## 💰 Wallet & Payment System

### Wallet Addresses

| Purpose | Address | Network |
|---------|---------|---------|
| **Developer Wallet** | `0x862C8f5C105981d88675A4825ae9a7E62103ae39` | Somnia Testnet |
| **NFT Contract** | `0x7580821e9C967Ce11c044ad95a911421eF62a604` | Somnia Testnet |
| **Factory Contract** | `0x71dc7Ab62cC0A4C79eb28c28cc33e24988E19f6e` | Somnia Testnet |

### Payment Flows

**1. Top Up Tokens**
```
User → Send 5/12/18 STT → 0x862C...3ae39
Backend → Add tokens to user account
```

**2. SomixPro Subscription**
```
User → Send 0.5 SOMI → 0x862C...3ae39
Backend → Activate Pro + 500 tokens
```

**3. NFT Mint**
```
User → Send 0.2 STT → 0x7580...2604 (NFT Contract)
Contract → Store payment
Owner → Can withdraw via withdraw()
```

**4. Withdraw Stars**
```
User → Request withdraw 50 stars
Backend → Send 5.0 STT from 0x862C...3ae39
User → Receive 5.0 STT
```

---

## 🔄 Data Flow - Complete System

```
USER ACTION
    ↓
┌──────────────────────────────────────┐
│  FRONTEND (Vercel)                   │
│  • User interaction                  │
│  • Wallet connection                  │
│  • UI rendering                      │
└───────────┬──────────────────────────┘
            │
            │ HTTP Request
            │
┌───────────▼──────────────────────────┐
│  BACKEND (Railway)                   │
│  • Express API                       │
│  • MongoDB query                     │
│  • External API calls                │
│  • WebSocket broadcast              │
└───────────┬──────────────────────────┘
            │
    ┌───────┴───────┐
    │               │
┌───▼───┐    ┌──────▼──────┐
│MongoDB│    │  BLOCKCHAIN  │
│       │    │              │
│Post   │    │ Smart        │
│User   │    │ Contract     │
│Like   │    │              │
│Mint   │    │ NFT Mint     │
│Star   │    │ Payment      │
└───────┘    └──────────────┘
```

---

## 🛠️ Installation

### Prerequisites
```bash
Node.js >= 18
MongoDB Atlas account
DeepAI API key
Pinata JWT token
WalletConnect Project ID
```

### Setup

**1. Clone Repository**
```bash
git clone https://github.com/yourusername/somix.git
cd somix
```

**2. Install Dependencies**
```bash
# Backend
cd somix-api && npm install

# Frontend
cd ../somix-web && npm install
```

**3. Environment Variables**

Backend (`.env`):
```env
PORT=3001
MONGO_URI=mongodb+srv://...
DEEPAI_KEY=your_key
PINATA_JWT=your_jwt
PRIVATE_KEY=your_private_key
WITHDRAW_RATE=0.1
```

Frontend (`.env`):
```env
VITE_API_BASE=https://somix-production.up.railway.app/api
VITE_CHAIN_ID=50312
VITE_RPC_URL=https://dream-rpc.somnia.network
VITE_NFT_CONTRACT=0x7580821e9C967Ce11c044ad95a911421eF62a604
VITE_WALLETCONNECT_PROJECT_ID=your_id
```

**4. Run Development**
```bash
# Backend
cd somix-api && npm run dev

# Frontend
cd somix-web && npm run dev
```

---

## 📊 Database Schema

### MongoDB Collections

#### **Posts**
```javascript
{
  _id: ObjectId,
  authorAddress: "0x...",
  author: {
    username: String,
    avatarUrl: String
  },
  caption: String,
  prompt: String,
  tags: [String],
  image: {
    cid: String,           // IPFS CID
    url: String,            // Full image URL
    thumbUrl: String,       // Thumbnail URL
    blurHash: String        // Blur placeholder
  },
  likeCount: Number,
  commentCount: Number,
  openMint: Boolean,
  editions: {
    cap: Number,            // Max editions
    minted: Number          // Current minted
  },
  nftContractAddress: String,
  createdAt: Date
}
```

#### **Users**
```javascript
{
  userId: Number,
  address: "0x...",
  username: String,
  tokens: Number,           // For AI generation
  stars: Number,            // NFT rewards (1 star = 0.1 STT)
  totalStarsEarned: Number,
  totalStarsWithdrawn: Number,
  isVerified: Boolean,
  isSomixPro: Boolean,
  followers: [String],
  following: [String]
}
```

#### **Mints**
```javascript
{
  postId: ObjectId,
  minterAddress: "0x...",
  nftTokenId: Number,
  contractAddress: "0x...",
  transactionHash: "0x...",
  createdAt: Date
}
```

---

## 🎨 Features Detail

### AI Generation Flow
```
1. User enter prompt
2. Call DeepAI API
3. Get generated image URL
4. Upload to IPFS via Pinata
5. Generate blurHash & thumbnail
6. Return metadata (cid, url, thumbUrl, blurHash)
```

### NFT Minting Flow
```
1. Prepare metadata (name, description, image)
2. Upload metadata to IPFS
3. Get tokenURI (ipfs://...)
4. Call publicMint(tokenURI) with 0.2 STT
5. Mint NFT to user's wallet
6. Reward creator with 2 stars
```

### Stars Withdraw Flow
```
1. User request withdraw (50 stars)
2. Backend calculate: 50 × 0.1 = 5.0 STT
3. Check developer wallet balance
4. Send 5.0 STT from dev wallet to user
5. Update user.stars: 50 → 0
6. Return txHash
```

---

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd somix-web
vercel --prod
```

### Backend (Railway)
```bash
cd somix-api
railway login
railway up
```

### Environment Variables

**Railway (Backend)**:
- `MONGO_URI`
- `DEEPAI_KEY`
- `PINATA_JWT`
- `PRIVATE_KEY`
- `PORT`

**Vercel (Frontend)**:
- `VITE_API_BASE`
- `VITE_CHAIN_ID`
- `VITE_RPC_URL`
- `VITE_NFT_CONTRACT`
- `VITE_WALLETCONNECT_PROJECT_ID`

---

## 🔍 Contract Verification

**Check Contract on Explorer**:
- SomixNFT: https://shannon-explorer.somnia.network/address/0x7580821e9C967Ce11c044ad95a911421eF62a604
- Factory: https://shannon-explorer.somnia.network/address/0x71dc7Ab62cC0A4C79eb28c28cc33e24988E19f6e
- Dev Wallet: https://shannon-explorer.somnia.network/address/0x862C8f5C105981d88675A4825ae9a7E62103ae39
