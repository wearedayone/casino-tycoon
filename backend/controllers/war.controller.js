import {
  getLatestWar,
  getUsersToAttack,
  getUserToAttackDetail,
  getWarHistoryLatest,
} from '../services/warSnapshot.service.js';
import logger from '../utils/logger.js';

export const getLastestWarSnapshot = async (req, res) => {
  try {
    const result = await getLatestWar(req.userId);
    return res.status(200).send(result);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
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
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};

export const getUserAttackDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getUserToAttackDetail(id);
    return res.status(200).send(result);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};

export const getUserWarHistoryLatest = async (req, res) => {
  try {
    const result = await getWarHistoryLatest({ userId: req.userId });
    return res.status(200).send(result);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};
