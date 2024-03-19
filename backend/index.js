import cron from 'node-cron';
import express from 'express';
import cors from 'cors';

import routes from './routes/index.js';
import environments from './utils/environments.js';
import { generateDailyWarSnapshot } from './services/warSnapshot.service.js';
import { updateSeasonSnapshotSchedule } from './services/season.service.js';
import Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

const { PORT, CRON_GANG_WAR } = environments;

const main = () => {
  const app = express();
  Sentry.init({
    dsn: 'https://06a864a118c421ec664450f821c06fa6@o4506374746603520.ingest.us.sentry.io/4506903978967040',
    integrations: [
      // enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // enable Express.js middleware tracing
      new Sentry.Integrations.Express({ app }),
      new ProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: 1.0,
  });
  app.use(cors());
  app.use(express.json());

  // The request handler must be the first middleware on the app
  app.use(Sentry.Handlers.requestHandler());

  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());

  // The error handler must be registered before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler());

  // Optional fallthrough error handler
  app.use(function onError(err, req, res, next) {
    // The error id is attached to `res.sentry` to be returned
    // and optionally displayed to the user for support.
    res.statusCode = 500;
    res.end(res.sentry + '\n');
  });

  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      console.error(err);
      return res.status(400).send({ status: 400, message: err.message }); // Bad request
    }
    next();
  });

  app.get('/', (req, res) => {
    res.send('OK');
  });

  // app.get('/test-schedule', async (req, res) => {
  //   await generateDailyWarSnapshot();
  //   return res.sendStatus(200);
  // });

  app.use('/api', routes);

  app.listen(PORT, () => console.log(`server is running on port ${PORT}`));

  // set a schedule in case server restarted
  updateSeasonSnapshotSchedule();
};

main();

// everyday at 1AM and 1PM
// cron.schedule(
//   CRON_GANG_WAR,
//   function () {
//     generateDailyWarSnapshot();
//   },
//   { timezone: 'Etc/UTC' }
// );
