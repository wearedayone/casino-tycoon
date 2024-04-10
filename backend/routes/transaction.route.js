import { Router } from 'express';

import auth from '../middlewares/auth.middleware.js';
import {
  create,
  validate,
  validateDailySpin,
  claimToken,
  getWorkerPrices,
  getBuildingPrices,
  buyAssetsXToken,
} from '../controllers/transaction.controller.js';

const router = Router();

router.post('/', auth, create);
router.post('/validation/daily-spin', auth, validateDailySpin);
router.post('/validation', auth, validate);
router.post('/claimToken', auth, claimToken);
router.get('/worker/price-chart', getWorkerPrices);
router.get('/building/price-chart', getBuildingPrices);
router.post('/assets/x-token', auth, buyAssetsXToken);
export default router;
