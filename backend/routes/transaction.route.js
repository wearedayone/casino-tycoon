import { Router } from 'express';

import auth from '../middlewares/auth.middleware.js';
import { create, validate, claimToken } from '../controllers/transaction.controller.js';

const router = Router();

router.post('/', auth, create);
router.post('/validation', auth, validate);
router.post('/claimToken', auth, claimToken);
export default router;
