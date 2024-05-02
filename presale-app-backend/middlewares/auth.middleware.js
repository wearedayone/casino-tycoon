import { auth } from '../configs/admin.config';

const auth = async (req, res, next) => {
  try {
    const idToken = req.headers.authorization?.split(' ')[1];
    if (!idToken) throw new Error('401');

    const decodedToken = await auth.verifyIdToken(idToken);
    req.userId = decodedToken.uid;

    next();
  } catch (err) {
    return res.sendStatus(401);
  }
};

export default auth;
