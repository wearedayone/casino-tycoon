import { Router } from 'express';

import { getLastestWarSnapshot } from '../controllers/war.controller.js';
import auth from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/latest', auth, getLastestWarSnapshot);

export default router;
