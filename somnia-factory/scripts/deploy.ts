import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  console.log("🚀 Deploying Factory contract to Somnia Testnet...");
  
  // Get provider and wallet
  const provider = new ethers.JsonRpcProvider(process.env.SOMNIA_RPC_HTTPS || "https://dream-rpc.somnia.network");
  const privateKey = process.env.OWNER_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error("OWNER_PRIVATE_KEY environment variable is not set");
  }
  
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log("📝 Deploying with account:", wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "STT");
  
  // Read contract artifacts
  const artifactPath = "./artifacts/contracts/SomixNFTFactory.sol/SomixNFTFactory.json";
  const fs = await import("fs");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  // Deploy Factory
  console.log("\n📦 Deploying SomixNFTFactory...");
  const Factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const factory = await Factory.deploy();
  
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  
  console.log("\n✅ SomixNFTFactory deployed to:", factoryAddress);
  console.log("\n🎉 Deployment complete!");
  console.log("\n📋 Next steps:");
  console.log("1. Copy this address:", factoryAddress);
  console.log("2. Update somix-web/src/app/web3/contract.js");
  console.log("3. Change FACTORY_CONTRACT_TESTNET to:", factoryAddress);
  console.log("4. Restart frontend application");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

