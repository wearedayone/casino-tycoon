import { Router } from 'express';

import auth from '../middlewares/auth.middleware.js';
import {
  getMe,
  getUserWarHistory,
  toggleWar,
  completeAskingWalletPassword,
  updateBalance,
} from '../controllers/user.controller.js';

const router = Router();

router.get('/me', auth, getMe);
router.put('/me/war', auth, toggleWar);
router.get('/me/war-history', auth, getUserWarHistory);
router.put('/me/wallet-password-ask', auth, completeAskingWalletPassword);
router.put('/me/balances', auth, updateBalance);

export default router;
