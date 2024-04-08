import { Router } from 'express';

import auth from '../middlewares/auth.middleware.js';
import {
  getGamePlayLeaderboard,
  getNextWarSnapshot,
  updateLastTimeSeenGangWarResult,
  updateUserWarMachines,
  updateUserWarAttack,
  getWarDeployment,
  upgradeUserMachines,
} from '../controllers/gamePlay.controller.js';

const router = Router();

router.get('/', auth, getGamePlayLeaderboard);
router.get('/next-war-time', getNextWarSnapshot);
router.put('/last-time-seen-war-result', auth, updateLastTimeSeenGangWarResult);
router.put('/war-machines', auth, updateUserWarMachines);
router.put('/war-attack', auth, updateUserWarAttack);
router.get('/war-deployment', auth, getWarDeployment);
router.put('/machine-levels', auth, upgradeUserMachines);

export default router;
