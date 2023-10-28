import { Router } from 'express';

import auth from '../middlewares/auth.middleware.js';
import { getMe, toggleWar } from '../controllers/user.controller.js';

const router = Router();

router.get('/me', auth, getMe);
router.put('/me/war', auth, toggleWar);

export default router;
