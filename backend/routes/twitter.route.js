import { Router } from 'express';

import { getOauthRequestToken, submitOauthData } from '../controllers/twitter.controller.js';
import auth from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/oauth-request-token', auth, getOauthRequestToken);
router.post('/access-token', auth, submitOauthData);

export default router;
