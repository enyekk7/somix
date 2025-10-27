import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  console.log("🚀 Deploying Single NFT Contract to Somnia Testnet...");
  
  // Get provider and wallet
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "https://dream-rpc.somnia.network");
  const privateKey = process.env.OWNER_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error("OWNER_PRIVATE_KEY environment variable is not set");
  }
  
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log("📝 Deploying with account:", wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "STT");
  
  // Read contract artifacts
  const artifactPath = "./artifacts/contracts/SomixNFT.sol/SomixNFT.json";
  const fs = await import("fs");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  // Fixed parameters
  const collectionName = "Somix Collection";
  const symbol = "SOMIX";
  const mintPrice = ethers.parseEther("0.2"); // 0.2 STT
  const maxSupply = "1000";
  
  console.log("\n📦 Deploying SomixNFT...");
  console.log("Collection Name:", collectionName);
  console.log("Symbol:", symbol);
  console.log("Mint Price:", ethers.formatEther(mintPrice), "STT");
  console.log("Max Supply:", maxSupply);
  
  // Deploy NFT Contract
  const NFT = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const nft = await NFT.deploy(
    wallet.address,    // owner
    collectionName,    // collection name
    symbol,            // symbol
    mintPrice,         // mint price
    maxSupply          // max supply
  );
  
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  
  console.log("\n✅ SomixNFT deployed to:", nftAddress);
  console.log("\n🎉 Deployment complete!");
  console.log("\n📋 Contract details:");
  console.log("- Address:", nftAddress);
  console.log("- Owner:", wallet.address);
  console.log("- Mint Price:", ethers.formatEther(mintPrice), "STT");
  console.log("- Max Supply:", maxSupply);
  console.log("\n🔗 Explorer URL: https://shannon-explorer.somnia.network/address/" + nftAddress);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});
