import { Router } from 'express';

import json from '../middlewares/json.middleware.js';
import userRoute from './user.route.js';
import transactionRoute from './transaction.route.js';

const router = Router();

router.all('*', json);
router.use('/v1/users', userRoute);
router.use('/v1/transactions', transactionRoute);

export default router;
