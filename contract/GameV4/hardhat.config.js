require('dotenv').config();

require('@nomicfoundation/hardhat-toolbox');
require('hardhat-gas-reporter');

const secrets = require('./secrets.json');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: '0.8.20',
  networks: {
    // eth_mainnet: {
    //   url: secrets.eth_mainnet_url || ``,
    //   accounts: [secrets.eth_mainnet_key],
    //   gasPrice: 15000000000,
    // },
    defaultNetwork: {
      url: 'hardhat',
    },
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    eth_goerli: {
      url: secrets.eth_goerli_url,
      accounts: [
        secrets.eth_goerli_key_owner,
        secrets.eth_goerli_key_team,
        secrets.eth_goerli_key_rev_share,
        secrets.eth_goerli_key_user,
      ],
      gasPrice: 15000000000,
    },
    // eth_sepolia: {
    //   url: secrets.sepolia_url || ``,
    //   accounts: [secrets.sepolia_key],
    // },
    base_goerli: {
      url: secrets.base_goerli_url || ``,
      accounts: [secrets.base_goerli_key],
      gasPrice: 1000000000,
      verify: {
        etherscan: {
          apiUrl: 'https://api-goerli.basescan.org',
          apiKey: process.env.ETHERSCAN_API_KEY ?? 'ETHERSCAN_API_KEY',
        },
      },
    },
    // base_mainnet: {
    //   url: secrets.base_mainnet_url || ``,
    //   accounts: [secrets.base_mainnet_key],
    //   gasPrice: 1000000000,
    //   verify: {
    //     etherscan: {
    //       apiUrl: 'https://api.basescan.org',
    //       apiKey: process.env.BASE_ETHERSCAN_API_KEY ?? 'ETHERSCAN_API_KEY',
    //     },
    //   },
    // },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
    token: 'ETH',
    gasPriceApi: 'https://api.etherscan.io/api?module=proxy&action=eth_gasPrice',
    coinmarketcap: '1bdef299-9f72-465d-a680-35fdb0b59db0',
  },
  etherscan: {
    apiKey: {
      // mantle_testnet: 'xyz', //random value
      goerli: '2JSFYE3G4DEMNFY5X1C34H28XNVUKGWWJ4',
      eth_goerli: '2JSFYE3G4DEMNFY5X1C34H28XNVUKGWWJ4',
      base_mainnet: process.env.BASE_ETHERSCAN_API_KEY ?? 'ETHERSCAN_API_KEY',
      baseGoerli: 'TPCIRFTJIGMCKINI7RZFXUQDJ48YY1ZJ4I',
    },
    customChains: [
      // {
      //   network: 'mantle_testnet',
      //   chainId: 5001,
      //   urls: {
      //     apiURL: 'https://explorer.testnet.mantle.xyz/api',
      //     browserURL: 'https://explorer.testnet.mantle.xyz',
      //   },
      // },
      // {
      //   network: 'base_mainnet',
      //   chainId: 8453,
      //   urls: {
      //     apiURL: 'https://api.basescan.org/api',
      //     browserURL: 'https://goerli.basescan.org',
      //   },
      // },
      {
        network: 'base_mainnet',
        chainId: 8453,
        urls: {
          apiURL: 'https://api.basescan.org/api',
          browserURL: 'https://goerli.basescan.org',
        },
      },
    ],
    // apiKey: process.env.ETHERSCAN_API_KEY,
  },
  mocha: {
    timeout: 100000,
  },
};
