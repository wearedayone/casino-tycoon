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
  WORKER_WALLET_PRIVATE_KEY: process.env.WORKER_WALLET_PRIVATE_KEY,
  SIGNER_WALLET_PRIVATE_KEY: process.env.SIGNER_WALLET_PRIVATE_KEY,
  SYSTEM_ADDRESS: process.env.SYSTEM_ADDRESS,
  CRON_GANG_WAR: process.env.CRON_GANG_WAR,
  GANG_WAR_MONITOR_URL: process.env.GANG_WAR_MONITOR_URL,
};

export default environments;
