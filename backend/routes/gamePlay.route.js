import { Router } from 'express';

import auth from '../middlewares/auth.middleware.js';
import {
  getGamePlayLeaderboard,
  getNextWarSnapshot,
  updateLastTimeSeenGangWarResult,
  getTotalVoters,
} from '../controllers/gamePlay.controller.js';

const router = Router();

router.get('/', auth, getGamePlayLeaderboard);
router.get('/next-war-time', getNextWarSnapshot);
router.put('/last-time-seen-war-result', auth, updateLastTimeSeenGangWarResult);
router.get('/voters', getTotalVoters);

export default router;
