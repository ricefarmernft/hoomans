// Import Hardhat and ethers.js
const { ethers } = require("hardhat");
require("dotenv").config();

// Function to start the WL sale
async function main() {
  // Replace with your deployed contract address
  const contractAddress = process.env.CONTRACT_ADDRESS;

  // Reveal variables
  const address = "0x9c52e752eccb54629d34326c49c25b03e2827d0b";

  // Replace with your contract name
  const Contract = await ethers.getContractFactory("Hoomans");

  // Attach to the deployed contract
  const contract = await Contract.attach(contractAddress);

  // Call the start WL sale function
  console.log("Owner Minting Hoomans...");
  const tx = await contract.ownerMint(address, 12);
  console.log("Transaction submitted:", tx.hash);
  await tx.wait();
  console.log("Hoomans minted successfully!");
}

// Run the script with error handling
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during contract interaction:", error);
    process.exit(1);
  });
