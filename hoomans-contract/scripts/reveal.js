// Import Hardhat and ethers.js
const { ethers } = require("hardhat");
require("dotenv").config();

// Function to start the WL sale
async function main() {
  // Replace with your deployed contract address
  const contractAddress = process.env.CONTRACT_ADDRESS;

  // Reveal variables
  const revealBaseUri = "";

  // Replace with your contract name
  const Contract = await ethers.getContractFactory("Hoomans");

  // Attach to the deployed contract
  const contract = await Contract.attach(contractAddress);

  // Call the start WL sale function
  console.log("Revealing Hoomans...");
  const tx = await contract.reveal(revealBaseUri);
  console.log("Transaction submitted:", tx.hash);
  await tx.wait();
  console.log("Hoomans revealed successfully!");
}

// Run the script with error handling
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during contract interaction:", error);
    process.exit(1);
  });
