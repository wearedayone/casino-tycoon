import { Router } from 'express';

import auth from '../middlewares/auth.middleware.js';
import { getMe, getUserWarHistory, toggleWar } from '../controllers/user.controller.js';

const router = Router();

router.get('/me', auth, getMe);
router.put('/me/war', auth, toggleWar);
router.get('/me/war-history', auth, getUserWarHistory);

export default router;
