import jwt from 'jsonwebtoken';

import environments from '../utils/environments.js';

const { PRIVY_APP_ID, PRIVY_VERIFICATION_KEY } = environments;

const middleware = async (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization;
    const token = authorizationHeader?.split(' ')?.[1];
    // for the moment, dont verify, just decode
    // TODO: implement verify later
    // const decoded = jwt.verify(token, PRIVY_VERIFICATION_KEY, {
    //   issuer: 'privy.io',
    //   audience: PRIVY_APP_ID,
    // });
    const decoded = jwt.decode(token, {
      issuer: 'privy.io',
      audience: PRIVY_APP_ID,
    });

    req.userId = decoded.sub;
    next();
  } catch (err) {
    return res.sendStatus(401);
  }
};

export default middleware;
