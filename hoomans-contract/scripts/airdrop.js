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
    "0xdbeE90c142c983F30CE6D724fc4031DB66Cb51cC",
    "0xFcf12aE3923c83a4b195fF1D207B2989b75b287c",
    "0xc8fB0913A8E36487710F838a08D4E66367D07924",
    "0x10A0FD7fb3396D2Cae703609323d655bC8ADf2B0",
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
