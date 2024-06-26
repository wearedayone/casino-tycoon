import cron from 'node-cron';

import { updateFIATPriceUniswapV2 } from './tasks/updateFIATPrice.js';
import updateNFTPrice from './tasks/updateNFTPrice.js';
import calculateAvgPrice from './tasks/calculateAvgPrice.js';
import estimateGasPrice from './tasks/estimateGas.js';
import getEthPrice from './tasks/getEthPrice.js';
import burnFiat from './tasks/burnFIAT.js';
import extractUser from './tasks/extractUser.js';
import environments from './utils/environments.js';

const {
  CRON_CALCULATE_WORKER_BUILDING_PRICE,
  CRON_UPDATE_FIAT_PRICE,
  CRON_UPDATE_NFT_PRICE,
  CRON_ESTIMATE_GAS_PRICE,
  CRON_GET_ETH_PRICE,
  CRON_BURN_FIAT,
  CRON_EXTRACT_USER,
} = environments;

cron.schedule(CRON_UPDATE_FIAT_PRICE, function () {
  updateFIATPriceUniswapV2();
});

cron.schedule(CRON_UPDATE_NFT_PRICE, function () {
  updateNFTPrice();
});

cron.schedule(
  CRON_CALCULATE_WORKER_BUILDING_PRICE,
  () => {
    calculateAvgPrice();
  },
  { timezone: 'Etc/UTC' }
);

cron.schedule(CRON_ESTIMATE_GAS_PRICE, function () {
  estimateGasPrice();
});

cron.schedule(CRON_GET_ETH_PRICE, function () {
  getEthPrice();
});

cron.schedule(CRON_BURN_FIAT, function () {
  burnFiat();
});

cron.schedule(CRON_EXTRACT_USER, function () {
  extractUser();
});
