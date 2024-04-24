import { Router } from 'express';

import auth from '../middlewares/auth.middleware.js';
import {
  create,
  validate,
  validateDailySpin,
  claimToken,
  claimXTokenHoldingReward,
  getWorkerPrices,
  getBuildingPrices,
  buyAssetsXToken,
  convertWeb2Token,
} from '../controllers/transaction.controller.js';

const router = Router();

router.post('/', auth, create);
router.post('/validation/daily-spin', auth, validateDailySpin);
router.post('/validation', auth, validate);
router.post('/claimToken', auth, claimToken);
router.post('/claim-holding-reward/x-token', auth, claimXTokenHoldingReward);
router.get('/worker/price-chart', getWorkerPrices);
router.get('/building/price-chart', getBuildingPrices);
router.post('/assets/x-token', auth, buyAssetsXToken);
router.post('/convert-x-token', auth, convertWeb2Token);

export default router;
