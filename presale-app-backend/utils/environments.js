import * as dotenv from 'dotenv';
dotenv.config();

const environments = {
  ENVIRONMENT: process.env.ENVIRONMENT,
  PORT: process.env.PORT,
};

export default environments;
