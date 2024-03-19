import { Router } from 'express';

import auth from '../middlewares/auth.middleware.js';
import {
  create,
  validate,
  claimToken,
  getWorkerAveragePrices,
  getBuildingAveragePrices,
} from '../controllers/transaction.controller.js';

const router = Router();

router.post('/', auth, create);
router.post('/validation', auth, validate);
router.post('/claimToken', auth, claimToken);
router.get('/worker/avg-prices', getWorkerAveragePrices);
router.get('/worker/avg-prices', getWorkerAveragePrices);
router.get('/building/avg-prices', getBuildingAveragePrices);
export default router;
