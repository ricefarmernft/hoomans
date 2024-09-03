require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");
require("dotenv").config();
require("hardhat-gas-reporter");
require("solidity-coverage");

const SEPOLIA_RPC_URL =
  process.env.SEPOLIA_RPC_URL || "https:://eth-sepolia/example";
const MAINNET_RPC_URL =
  process.env.MAINNET_RPC_URL || "https:://eth-mainnet/example";
const BASE_RPC_URL = process.env.BASE_RPC_URL || "https:://eth-base/example";
const BASE_SEPOLIA_RPC_URL =
  process.env.BASE_SEPOLIA_RPC_URL || "https:://eth-base-sepolia/example";

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xKey";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "0xKey";
const BASE_SEPOLIA_KEY = process.env.BASE_SEPOLIA_API_KEY || "0xKey";
const BASESCAN_KEY = process.env.BASESCAN_API_KEY || "0xKey";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "0xKey";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.26",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 1337,
      blockConfirmations: 1,
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
      blockConfirmations: 1,
      deploy: ["deploy/sepolia"],
    },
    mainnet: {
      url: MAINNET_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 1,
      blockConfirmations: 1,
      deploy: ["deploy/mainnet"],
    },
    base: {
      url: BASE_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 8453,
      blockConfirmations: 1,
      deploy: ["deploy/base"],
    },
    baseSepolia: {
      url: BASE_SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 84532,
      blockConfirmations: 1,
      deploy: ["deploy/base-sepolia"],
    },
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
      1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
      4: "0xA296a3d5F026953e17F472B497eC29a5631FB51B", // but for rinkeby it will be a specific address
      sepolia: "0xc8fB0913A8E36487710F838a08D4E66367D07924",
      base: "0x7CE4FA787582C9e5c9fEe9F1B6803Fd794359A69",
      baseSepolia: "0x7CE4FA787582C9e5c9fEe9F1B6803Fd794359A69",
    },
    feeCollector: {
      default: 1, // here this will by default take the second account as feeCollector (so in the test this will be a different account than the deployer)
      1: "0xa5610E1f289DbDe94F3428A9df22E8B518f65751", // on the mainnet the feeCollector could be a multi sig
      4: "0xa250ac77360d4e837a13628bC828a2aDf7BabfB3", // on rinkeby it could be another account
    },
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      baseSepolia: BASE_SEPOLIA_KEY,
      base: BASESCAN_KEY,
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://base-sepolia.blockscout.com/api",
          browserURL: "https://base-sepolia.blockscout.com/",
        },
      },
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org/",
        },
      },
    ],
    gasReporter: {
      // Enable = On/Off Switch
      enabled: true,
      currency: "USD",
      outputFile: "gas-report.txt",
      noColors: true,
      coinmarketcap: COINMARKETCAP_API_KEY,
      // token: "matic",
    },
  },
};
