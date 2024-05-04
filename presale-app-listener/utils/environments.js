import * as dotenv from 'dotenv';
dotenv.config();

const environments = {
  ENVIRONMENT: process.env.ENVIRONMENT,
  NETWORK_ID: process.env.NETWORK_ID,
  QUICKNODE_API_ENDPOINT: process.env.QUICKNODE_API_ENDPOINT,
  LOG_PATH: process.env.LOG_PATH,
  MINTER_ADDRESS: process.env.MINTER_ADDRESS,
};

export default environments;
