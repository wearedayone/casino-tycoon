import cron from 'node-cron';
import express from 'express';
import cors from 'cors';

import routes from './routes/index.js';
import environments from './utils/environments.js';
import { takeDailyWarSnapshot } from './services/warSnapshot.service.js';
import { updateSeasonSnapshotSchedule } from './services/season.service.js';
import { updateEstimatedGasPrice } from './services/system.service.js';

const { PORT } = environments;

const main = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/', (req, res) => {
    res.send('OK');
  });

  app.use('/api', routes);

  app.listen(PORT, () => console.log(`server is running on port ${PORT}`));

  // set a schedule in case server restarted
  updateSeasonSnapshotSchedule();
};

main();

// everyday at 1am
cron.schedule('0 1 * * *', function () {
  takeDailyWarSnapshot();
});

// every 5 minutes
cron.schedule('*/5 * * * *', function () {
  updateEstimatedGasPrice();
});
