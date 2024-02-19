import { Router } from 'express';

import auth from '../middlewares/auth.middleware.js';
import {
  getGamePlayLeaderboard,
  getNextWarSnapshot,
  updateLastTimeSeenGangWarResult,
  getTotalVoters,
  updateUserWarMachines,
  updateUserWarAttack,
  getWarDeployment,
} from '../controllers/gamePlay.controller.js';

const router = Router();

router.get('/', auth, getGamePlayLeaderboard);
router.get('/next-war-time', getNextWarSnapshot);
router.put('/last-time-seen-war-result', auth, updateLastTimeSeenGangWarResult);
router.get('/voters', getTotalVoters);
router.put('/war-machines', auth, updateUserWarMachines);
router.put('/war-attack', auth, updateUserWarAttack);
router.get('/war-deployment', auth, getWarDeployment);

export default router;
