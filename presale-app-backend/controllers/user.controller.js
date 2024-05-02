import * as services from '../services/user.service.js';
import logger from '../utils/logger.js';

export const createUser = async (req, res) => {
  try {
    const { message, signature } = req.body;
    const data = await services.createUser({
      message,
      signature,
    });
    return res.status(200).send(data);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    return res.status(400).send(err.message);
  }
};
