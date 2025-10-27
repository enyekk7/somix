import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  console.log("🔍 Checking Contract Status...");
  
  // Get provider and wallet
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "https://dream-rpc.somnia.network");
  const privateKey = process.env.OWNER_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error("OWNER_PRIVATE_KEY environment variable is not set");
  }
  
  const wallet = new ethers.Wallet(privateKey, provider);
  
  const contractAddress = "0x7580821e9C967Ce11c044ad95a911421eF62a604";
  
  console.log("📝 Checking contract:", contractAddress);
  
  // Read contract artifacts
  const artifactPath = "./artifacts/contracts/SomixNFT.sol/SomixNFT.json";
  const fs = await import("fs");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  // Create contract instance
  const contract = new ethers.Contract(contractAddress, artifact.abi, wallet);
  
  try {
    // Read contract state
    const mintingEnabled = await contract.mintingEnabled();
    const mintPrice = await contract.mintPrice();
    const totalMinted = await contract.totalMinted();
    const maxSupply = await contract.maxSupply();
    const owner = await contract.owner();
    
    console.log("\n📊 Contract Status:");
    console.log("- Owner:", owner);
    console.log("- Minting Enabled:", mintingEnabled);
    console.log("- Mint Price:", ethers.formatEther(mintPrice), "STT");
    console.log("- Total Minted:", totalMinted.toString());
    console.log("- Max Supply:", maxSupply.toString());
    console.log("- Available:", (maxSupply - totalMinted).toString());
    
    // Check wallet balance
    const balance = await provider.getBalance(wallet.address);
    console.log("\n💰 Wallet Balance:", ethers.formatEther(balance), "STT");
    
    // Check if wallet has enough for mint
    const canMint = balance >= mintPrice;
    console.log("- Can Mint:", canMint ? "✅ Yes" : "❌ No (insufficient balance)");
    
  } catch (error) {
    console.error("❌ Error reading contract:", error.message);
  }
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
