import { Router } from 'express';

import { getLastestWarSnapshot, getUserListToAttack } from '../controllers/war.controller.js';
import auth from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/latest', auth, getLastestWarSnapshot);

router.get('/users-to-attack', auth, getUserListToAttack);

export default router;
