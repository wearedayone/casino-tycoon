import * as services from '../services/twitter.service.js';
import logger from '../utils/logger.js';

export const getOauthRequestToken = async (req, res) => {
  try {
    const result = await services.getOauthRequestToken();
    return res.status(200).send(result);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};

export const submitOauthData = async (req, res) => {
  try {
    const { userId } = req;
    const { oauth_token, oauth_verifier } = req.body;
    const result = await services.submitOauthData({ userId, oauth_token, oauth_verifier });
    return res.status(200).send(result);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};
