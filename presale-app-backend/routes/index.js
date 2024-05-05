import { Router } from 'express';

import json from '../middlewares/json.middleware.js';
import userRoute from './user.route.js';
import twitterRoute from './twitter.route.js';
import walletRoute from './wallet.route.js';

const router = Router();

router.all('*', json);
router.use('/v1/users', userRoute);
router.use('/v1/twitter', twitterRoute);
router.use('/v1/wallet', walletRoute);

export default router;
