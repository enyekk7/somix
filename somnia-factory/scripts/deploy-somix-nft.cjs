const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying SomixNFT contract...");

  // Get the contract factory
  const SomixNFT = await hre.ethers.getContractFactory("SomixNFT");

  // Contract parameters
  const initialOwner = "0x0568Ed131d0Dc3FC5AfdAd23615CDfAE9e1526fD"; // Your wallet address
  const collectionName = "Somix Collection";
  const symbol = "SOMIX";
  const mintPrice = hre.ethers.parseEther("0.01"); // 0.01 ETH
  const maxSupply = 1000; // Maximum supply

  console.log("📋 Contract Parameters:");
  console.log(`  - Owner: ${initialOwner}`);
  console.log(`  - Name: ${collectionName}`);
  console.log(`  - Symbol: ${symbol}`);
  console.log(`  - Mint Price: ${hre.ethers.formatEther(mintPrice)} ETH`);
  console.log(`  - Max Supply: ${maxSupply}`);

  // Deploy the contract
  const somixNFT = await SomixNFT.deploy(
    initialOwner,
    collectionName,
    symbol,
    mintPrice,
    maxSupply
  );

  await somixNFT.waitForDeployment();

  const contractAddress = await somixNFT.getAddress();
  console.log(`✅ SomixNFT deployed to: ${contractAddress}`);

  // Verify contract state
  console.log("\n🔍 Verifying contract state...");
  const deployedMintPrice = await somixNFT.mintPrice();
  const deployedMaxSupply = await somixNFT.maxSupply();
  const deployedMintingEnabled = await somixNFT.mintingEnabled();
  const deployedTotalMinted = await somixNFT.totalMinted();

  console.log(`  - Mint Price: ${hre.ethers.formatEther(deployedMintPrice)} ETH`);
  console.log(`  - Max Supply: ${deployedMaxSupply}`);
  console.log(`  - Minting Enabled: ${deployedMintingEnabled}`);
  console.log(`  - Total Minted: ${deployedTotalMinted}`);

  // Save contract address to file
  const fs = require('fs');
  const contractInfo = {
    address: contractAddress,
    name: collectionName,
    symbol: symbol,
    mintPrice: hre.ethers.formatEther(mintPrice),
    maxSupply: maxSupply,
    deployedAt: new Date().toISOString(),
    network: "Somnia Testnet"
  };

  fs.writeFileSync(
    'deployed-contract.json',
    JSON.stringify(contractInfo, null, 2)
  );

  console.log(`\n💾 Contract info saved to deployed-contract.json`);
  console.log(`\n🎉 Deployment completed successfully!`);
  console.log(`\n📝 Next steps:`);
  console.log(`  1. Update contract address in frontend`);
  console.log(`  2. Test minting functionality`);
  console.log(`  3. Verify on explorer: https://shannon-explorer.somnia.network/address/${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
