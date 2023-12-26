import { Router } from 'express';

import { getRankingRewards } from '../controllers/season.controller.js';

const router = Router();

router.get('/ranking-rewards', getRankingRewards);

export default router;
