import * as dotenv from 'dotenv';
dotenv.config();

const environments = {
  ENVIRONMENT: process.env.ENVIRONMENT,
  PORT: process.env.PORT,
  NETWORK_ID: process.env.NETWORK_ID,
  ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
  LOG_PATH: process.env.LOG_PATH,
};

export default environments;
