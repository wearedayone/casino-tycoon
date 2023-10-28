import cron from 'node-cron';
import express from 'express';
import cors from 'cors';

import routes from './routes/index.js';
import environments from './utils/environments.js';
import { takeDailyWarSnapshot } from './services/warSnapshot.service.js';

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
};

main();

// everyday at 1am
cron.schedule('0 1 * * *', function () {
  takeDailyWarSnapshot();
});
