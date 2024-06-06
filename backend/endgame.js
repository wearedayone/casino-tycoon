import cron from 'node-cron';
import express from 'express';
import cors from 'cors';

import routes from './routes/index.js';
import environments from './utils/environments.js';
import { generateDailyWarSnapshot } from './services/warSnapshot.service.js';
import { takeSeasonLeaderboardSnapshot } from './services/season.service.js';

const { PORT } = environments;

const main = () => {
  // takeSeasonLeaderboardSnapshot();
};

main();
