import { Router } from 'express';

import * as controller from '../controllers/wallet.controller.js';
import auth from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/signatures/mint', auth, controller.getSignatureMint);

export default router;
