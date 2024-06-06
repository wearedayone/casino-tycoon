import { getWorkerPrices, getBuildingPrices } from '../services/season.service.js';
import logger from '../utils/logger.js';

export const getWorkerPriceHistory = async (req, res) => {
  try {
    const result = await getWorkerPrices();
    return res.status(200).send(result);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};

export const getBuildingPriceHistory = async (req, res) => {
  try {
    const result = await getBuildingPrices();
    return res.status(200).send(result);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};
