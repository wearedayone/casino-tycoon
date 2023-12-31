import { getLatestWar, getUsersToAttack } from '../services/warSnapshot.service.js';
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

export const getUserListToAttack = async (req, res) => {
  try {
    const { page = '0', limit = '50', search = '' } = req.query;
    const result = await getUsersToAttack({ page: Number(page), limit: Number(limit), search });
    return res.status(200).send(result);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    return res.status(400).send(err.message);
  }
};
