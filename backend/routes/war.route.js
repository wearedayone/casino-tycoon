import { Router } from 'express';

import { getLastestWarSnapshot, getUserListToAttack, getUserAttackDetail } from '../controllers/war.controller.js';
import auth from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/latest', auth, getLastestWarSnapshot);

router.get('/users-to-attack', auth, getUserListToAttack);

router.get('/users-to-attack/:id', getUserAttackDetail);

export default router;
