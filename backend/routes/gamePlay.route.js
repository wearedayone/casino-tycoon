import { Router } from 'express';

import auth from '../middlewares/auth.middleware.js';
import { getGamePlayLeaderboard } from '../controllers/gamePlay.controller.js';

const router = Router();

router.get('/', auth, getGamePlayLeaderboard);

export default router;
