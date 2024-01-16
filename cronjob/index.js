import cron from 'node-cron';

import { updateFIATPriceUniswapV2 } from './tasks/updateFIATPrice.js';
import calculateAvgPrice from './tasks/calculateAvgPrice.js';
import estimateGasPrice from './tasks/estimateGas.js';
import environments from './utils/environments.js';

const { CRON_CALCULATE_WORKER_BUILDING_PRICE, CRON_UPDATE_FIAT_PRICE, CRON_ESTIMATE_GAS_PRICE } = environments;

cron.schedule(CRON_UPDATE_FIAT_PRICE, function () {
  updateFIATPriceUniswapV2();
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
