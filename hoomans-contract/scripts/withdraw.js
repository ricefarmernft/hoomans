// Import Hardhat and ethers.js
const { ethers } = require("hardhat");
require("dotenv").config();

// Function to start the WL sale
async function main() {
  // Replace with your deployed contract address
  const contractAddress = process.env.CONTRACT_ADDRESS;

  // Withdrawal variables
  const withdrawalAddress = "0x70e3d534196db1B9F7B07ad47082671bB0121d15";
  const withdrawalAmount = ethers.parseEther("6.4604");

  // Replace with your contract name
  const Contract = await ethers.getContractFactory("Hoomans");

  // Attach to the deployed contract
  const contract = await Contract.attach(contractAddress);

  // Call the start WL sale function
  console.log("Withdrawing funds...");
  const tx = await contract.withdraw(withdrawalAddress, withdrawalAmount);
  console.log("Transaction submitted:", tx.hash);
  await tx.wait();
  console.log("Funds withdrawn successfully!");
}

// Run the script with error handling
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during contract interaction:", error);
    process.exit(1);
  });
