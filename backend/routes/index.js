import { Router } from 'express';

import json from '../middlewares/json.middleware.js';
import userRoute from './user.route.js';
import transactionRoute from './transaction.route.js';
import gamePlayRoute from './gamePlay.route.js';
import seasonRoute from './season.route.js';
import warRoute from './war.route.js';

const router = Router();

router.all('*', json);
router.use('/v1/users', userRoute);
router.use('/v1/transactions', transactionRoute);
router.use('/v1/gamePlays', gamePlayRoute);
router.use('/v1/seasons', seasonRoute);
router.use('/v1/wars', warRoute);

export default router;
