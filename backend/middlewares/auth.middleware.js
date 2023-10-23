import jwt from 'jsonwebtoken';

import environments from '../utils/environments.js';

const { PRIVY_APP_ID, PRIVY_VERIFICATION_KEY } = environments;

const middleware = async (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization;
    const token = authorizationHeader?.split(' ')?.[1];
    const verificationKey = PRIVY_VERIFICATION_KEY.replace(/\\n/g, '\n');

    const decoded = jwt.verify(token, verificationKey, {
      issuer: 'privy.io',
      audience: PRIVY_APP_ID,
    });

    req.userId = decoded.sub;
    next();
  } catch (err) {
    console.error(err);
    return res.sendStatus(401);
  }
};

export default middleware;
