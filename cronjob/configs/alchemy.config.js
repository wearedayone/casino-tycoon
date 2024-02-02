import { Network, Alchemy } from 'alchemy-sdk';

import environments from '../utils/environments.js';

const { NETWORK_ID, ALCHEMY_API_KEY } = environments;

const network = NETWORK_ID === '8453' ? Network.BASE_MAINNET : Network.BASE_SEPOLIA;
const settings = {
  apiKey: ALCHEMY_API_KEY,
  network,
};
const alchemy = new Alchemy(settings);

export default alchemy;
