import { auth } from '../configs/firebase.config.js';
import logger from '../utils/logger.js';

const authMiddleware = async (req, res, next) => {
  try {
    const idToken = req.headers.authorization?.split(' ')[1];
    if (!idToken) throw new Error('401');

    const decodedToken = await auth.verifyIdToken(idToken);
    req.userId = decodedToken.uid;

    next();
  } catch (err) {
    logger.error(err.message);
    return res.sendStatus(401);
  }
};

export default authMiddleware;
