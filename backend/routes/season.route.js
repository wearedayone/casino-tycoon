import { Router } from 'express';

import auth from '../middlewares/auth.middleware.js';
import { getWorkerPriceHistory, getBuildingPriceHistory } from '../controllers/season.controller.js';

const router = Router();

router.get('/worker-price', auth, getWorkerPriceHistory);
router.get('/building-price', auth, getBuildingPriceHistory);

export default router;
