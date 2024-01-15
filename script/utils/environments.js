import * as dotenv from 'dotenv';
dotenv.config();

const environments = {
  ENVIRONMENT: process.env.ENVIRONMENT,
  WALLET_PRIVATE_KEY: process.env.WALLET_PRIVATE_KEY,
  WALLET_WORKER_PRIVATE_KEY: process.env.WALLET_WORKER_PRIVATE_KEY,
  NETWORK_ID: process.env.NETWORK_ID,
  ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
  TOKEN_ADDRESS: process.env.TOKEN_ADDRESS,
  NFT_ADDRESS: process.env.NFT_ADDRESS,
  GAME_CONTRACT_ADDRESS: process.env.GAME_CONTRACT_ADDRESS,
  ROUTER_ADDRESS: process.env.ROUTER_ADDRESS,
  WETH_ADDRESS: process.env.WETH_ADDRESS,
  PAIR_ADDRESS: process.env.PAIR_ADDRESS,
  PRIVY_APP_ID: process.env.PRIVY_APP_ID,
  PRIVY_APP_SECRET: process.env.PRIVY_APP_SECRET,
};

export default environments;
