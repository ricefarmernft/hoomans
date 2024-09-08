// Import Hardhat and ethers.js
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  // Replace with your deployed contract address
  const contractAddress = process.env.CONTRACT_ADDRESS;

  // Replace with your contract name used in deployment
  const Contract = await ethers.getContractFactory("Hoomans");

  // Connect to the deployed contract using the contract address and signer
  const contract = await Contract.attach(contractAddress);

  // Call the airdrop function
  console.log("Submitting airdrop transaction...");
  const tx = await contract.publicMint(10);
  console.log("Transaction hash:", tx.hash);

  // Wait for the transaction to be mined
  await tx.wait();
  console.log("Airdrop completed successfully!");
}

// Run the script with error handling
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during contract interaction:", error);
    process.exit(1);
  });
