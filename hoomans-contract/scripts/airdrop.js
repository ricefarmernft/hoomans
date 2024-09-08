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

  // Define the array of addresses you want to airdrop to
  const addresses = [
    "0x9c52e752eccb54629d34326c49c25b03e2827d0b",
    "0x018f63bc5bd3c3d05bacce508d7a4e5f910d7a1a",
    "0x694367ea528240fec8172581282ff171a6ec39aa",
  ];

  // Call the airdrop function
  console.log("Submitting airdrop transaction...");
  const tx = await contract.airdrop(addresses);
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
