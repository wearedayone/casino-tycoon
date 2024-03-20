import { Router } from 'express';

import auth from '../middlewares/auth.middleware.js';
import {
  create,
  validate,
  claimToken,
  getWorkerPrices,
  getBuildingPrices,
} from '../controllers/transaction.controller.js';

const router = Router();

router.post('/', auth, create);
router.post('/validation', auth, validate);
router.post('/claimToken', auth, claimToken);
router.get('/worker/price-chart', auth, getWorkerPrices);
router.get('/building/price-chart', auth, getBuildingPrices);
export default router;
