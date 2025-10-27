import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  console.log("🔍 Checking User Wallet Status...");
  
  // Get provider
  const provider = new ethers.JsonRpcProvider("https://dream-rpc.somnia.network");
  
  const contractAddress = "0x7580821e9C967Ce11c044ad95a911421eF62a604";
  const userWallet = "0x0568Ed131d0Dc3FC5AfdAd23615CDfAE9e1526fD"; // From error log
  
  console.log("📝 Checking user wallet:", userWallet);
  
  // Read contract artifacts
  const artifactPath = "./artifacts/contracts/SomixNFT.sol/SomixNFT.json";
  const fs = await import("fs");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  // Create contract instance
  const contract = new ethers.Contract(contractAddress, artifact.abi, provider);
  
  try {
    // Read contract state
    const mintPrice = await contract.mintPrice();
    
    // Check user wallet balance
    const balance = await provider.getBalance(userWallet);
    
    console.log("\n📊 User Wallet Status:");
    console.log("- Address:", userWallet);
    console.log("- Balance:", ethers.formatEther(balance), "STT");
    console.log("- Required:", ethers.formatEther(mintPrice), "STT");
    
    // Check if user has enough for mint
    const canMint = balance >= mintPrice;
    console.log("- Can Mint:", canMint ? "✅ Yes" : "❌ No (insufficient balance)");
    
    if (!canMint) {
      console.log("\n💡 Solution: User needs to get STT tokens");
      console.log("- Faucet: https://faucet.somnia.network/");
      console.log("- Or transfer from another wallet");
    }
    
  } catch (error) {
    console.error("❌ Error checking wallet:", error.message);
  }
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
