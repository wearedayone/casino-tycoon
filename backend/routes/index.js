import { Router } from 'express';

import json from '../middlewares/json.middleware.js';
import userRoute from './user.route.js';
import transactionRoute from './transaction.route.js';
import gamePlayRoute from './gamePlay.route.js';
import warRoute from './war.route.js';
import seasonRoute from './season.route.js';
import twitterRoute from './twitter.route.js';

const router = Router();

router.all('*', json);
router.use('/v1/users', userRoute);
router.use('/v1/transactions', transactionRoute);
router.use('/v1/gamePlays', gamePlayRoute);
router.use('/v1/wars', warRoute);
router.use('/v1/season', seasonRoute);
router.use('/v1/twitter', twitterRoute);

export default router;
