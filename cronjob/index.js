import cron from 'node-cron';
import { updateFIATPrice } from './tasks/updateFIATPrice.js';
import calculateAvgPrice from './tasks/calculateAvgPrice.js';

cron.schedule('*/15 * * * *', function () {
  updateFIATPrice();
});

// everyday at 1am
cron.schedule(
  '0 1 * * *',
  () => {
    calculateAvgPrice();
  },
  { timezone: 'Etc/UTC' }
);
