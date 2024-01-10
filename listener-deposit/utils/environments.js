import * as dotenv from 'dotenv';
dotenv.config();

const environments = {
  ENVIRONMENT: process.env.ENVIRONMENT,
  PORT: process.env.PORT,
  NETWORK_ID_LAYER_1: process.env.NETWORK_ID_LAYER_1,
  ALCHEMY_API_KEY_LAYER_1: process.env.ALCHEMY_API_KEY_LAYER_1,
  NETWORK_ID_LAYER_2: process.env.NETWORK_ID_LAYER_2,
  ALCHEMY_API_KEY_LAYER_2: process.env.ALCHEMY_API_KEY_LAYER_2,
  LOG_PATH: process.env.LOG_PATH,
  DEPOSIT_LAYER_1_ADDRESS: process.env.DEPOSIT_LAYER_1_ADDRESS,
  DEPOSIT_LAYER_2_ADDRESS: process.env.DEPOSIT_LAYER_2_ADDRESS,
  DEPOSIT_SYSTEM_WALLET_PRIVATE_KEY: process.env.DEPOSIT_SYSTEM_WALLET_PRIVATE_KEY,
};

export default environments;
