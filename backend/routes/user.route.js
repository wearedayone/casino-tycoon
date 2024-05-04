import { Router } from 'express';

import auth from '../middlewares/auth.middleware.js';
import {
  getMe,
  getUserWarHistory,
  getUserWarHistoryDetail,
  completeAskingWalletPassword,
  updateBalance,
  getRank,
  setLastOnlineTime,
  applyReferralCode,
  completeTutorial,
  getUser,
  checkUserCode,
  getReferralCode,
} from '../controllers/user.controller.js';

const router = Router();

router.get('/', getUser); // get user by code
router.get('/me', auth, getMe);
router.put('/me/invite-code', auth, applyReferralCode);
router.get('/me/war-history', auth, getUserWarHistory);
router.get('/me/war-history/:warSnapshotId/:warResultId', auth, getUserWarHistoryDetail);
router.put('/me/wallet-password-ask', auth, completeAskingWalletPassword);
router.put('/me/balances', auth, updateBalance);
router.get('/me/rank', auth, getRank);
router.put('/me/last-online-time', auth, setLastOnlineTime);
router.put('/me/tutorial', auth, completeTutorial);
router.get('/code', auth, getReferralCode);
router.put('/code', auth, checkUserCode);

export default router;
