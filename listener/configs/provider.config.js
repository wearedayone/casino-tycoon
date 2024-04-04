import { JsonRpcProvider } from '@ethersproject/providers';

import environments from '../utils/environments.js';

const { RPC_URL } = environments;

const provider = new JsonRpcProvider(RPC_URL);

export default provider;
