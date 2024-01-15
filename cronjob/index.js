import cron from 'node-cron';
import { updateFIATPriceUniswapV3, updateFIATPriceUniswapV2 } from './tasks/updateFIATPrice.js';
import calculateAvgPrice from './tasks/calculateAvgPrice.js';
cron.schedule('*/15 * * * *', function () {
  updateFIATPriceUniswapV2();
});

// everyday at 1am
cron.schedule(
  '0 1 * * *',
  () => {
    calculateAvgPrice();
  },
  { timezone: 'Etc/UTC' }
);
