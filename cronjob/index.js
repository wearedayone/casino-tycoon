import cron from 'node-cron';
import { updateFIATPrice } from './tasks/updateFIATPrice.js';

// everyday at 1am
cron.schedule('*/15 * * * *', function () {
  updateFIATPrice();
});
