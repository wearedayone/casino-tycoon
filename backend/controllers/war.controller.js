import { getLatestWar } from '../services/warSnapshot.service.js';
import logger from '../utils/logger.js';

export const getLastestWarSnapshot = async (req, res) => {
  try {
    const result = await getLatestWar(req.userId);
    return res.status(200).send(result);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    return res.status(400).send(err.message);
  }
};
