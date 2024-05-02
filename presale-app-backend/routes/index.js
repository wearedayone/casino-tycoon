import { Router } from 'express';

import json from '../middlewares/json.middleware.js';
import userRoute from './user.route.js';

const router = Router();

router.all('*', json);
router.use('/v1/users', userRoute);

export default router;
