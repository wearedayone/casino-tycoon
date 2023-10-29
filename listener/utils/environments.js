import * as dotenv from 'dotenv';
dotenv.config();

const environments = {
  ENVIRONMENT: process.env.ENVIRONMENT,
  PORT: process.env.PORT,
  NETWORK_ID: process.env.NETWORK_ID,
  PRIVY_APP_ID: process.env.PRIVY_APP_ID,
  PRIVY_APP_SECRET: process.env.PRIVY_APP_SECRET,
  PRIVY_VERIFICATION_KEY: process.env.PRIVY_VERIFICATION_KEY,
  ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
  TOKEN_ADDRESS: process.env.TOKEN_ADDRESS,
};

export default environments;
