import * as dotenv from 'dotenv';
dotenv.config();

const environments = {
  ENVIRONMENT: process.env.ENVIRONMENT,
  WALLET_PRIVATE_KEY: process.env.WALLET_PRIVATE_KEY,
  NETWORK_ID: process.env.NETWORK_ID,
  ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
  TOKEN_ADDRESS: process.env.TOKEN_ADDRESS,
  NFT_ADDRESS: process.env.NFT_ADDRESS,
  GAME_CONTRACT_ADDRESS: process.env.GAME_CONTRACT_ADDRESS,
};

export default environments;
