import { JsonRpcProvider } from '@ethersproject/providers';

import environments from '../utils/environments.js';

const { QUICKNODE_API_ENDPOINT } = environments;

const quickNode = new JsonRpcProvider(QUICKNODE_API_ENDPOINT);

export default quickNode;
