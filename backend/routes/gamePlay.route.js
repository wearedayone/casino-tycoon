import { Router } from 'express';

import auth from '../middlewares/auth.middleware.js';
import { getGamePlayLeaderboard, getNextWarSnapshot } from '../controllers/gamePlay.controller.js';

const router = Router();

router.get('/', auth, getGamePlayLeaderboard);

router.get('/next-war-time', getNextWarSnapshot);

export default router;
