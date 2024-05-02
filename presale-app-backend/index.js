import express from 'express';
import cors from 'cors';

import routes from './routes/index.js';
import environments from './utils/environments.js';

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
