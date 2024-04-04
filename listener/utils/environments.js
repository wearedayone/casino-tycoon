import * as dotenv from 'dotenv';
dotenv.config();

const environments = {
  ENVIRONMENT: process.env.ENVIRONMENT,
  PORT: process.env.PORT,
  NETWORK_ID: process.env.NETWORK_ID,
  RPC_URL: process.env.RPC_URL,
  LOG_PATH: process.env.LOG_PATH,
};

export default environments;
