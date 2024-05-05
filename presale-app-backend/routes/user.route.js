import { Router } from 'express';

import * as controller from '../controllers/user.controller.js';

const router = Router();

router.post('/', controller.createUser);

export default router;
