import { WebSocketProvider } from '@ethersproject/providers';

import environments from '../utils/environments.js';

const { RPC_URL } = environments;

const provider = new WebSocketProvider(RPC_URL);

export default provider;
