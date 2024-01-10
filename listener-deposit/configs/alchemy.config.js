import { Network, Alchemy } from 'alchemy-sdk';

import environments from '../utils/environments.js';

const { NETWORK_ID_LAYER_1, ALCHEMY_API_KEY_LAYER_1, NETWORK_ID_LAYER_2, ALCHEMY_API_KEY_LAYER_2 } = environments;

const layer1Settings = {
  apiKey: ALCHEMY_API_KEY_LAYER_1,
  network: Network[NETWORK_ID_LAYER_1],
};

const layer2Settings = {
  apiKey: ALCHEMY_API_KEY_LAYER_2,
  network: Network[NETWORK_ID_LAYER_2],
};

export const alchemyLayer1 = new Alchemy(layer1Settings);

export const alchemyLayer2 = new Alchemy(layer2Settings);
