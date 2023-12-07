import * as dotenv from 'dotenv';
dotenv.config();

const environments = {
  ENVIRONMENT: process.env.ENVIRONMENT,
  WALLET_PRIVATE_KEY: process.env.WALLET_PRIVATE_KEY,
  NETWORK_ID: process.env.NETWORK_ID,
  ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
};

export default environments;
