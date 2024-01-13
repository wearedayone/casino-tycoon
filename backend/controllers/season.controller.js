import { getWorkerPrices, getBuildingPrices } from '../services/season.service.js';
import logger from '../utils/logger.js';

export const getWorkerPriceHistory = async (req, res) => {
  try {
    const result = await getWorkerPrices();
    return res.status(200).send(result);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    return res.status(400).send(err.message);
  }
};

export const getBuildingPriceHistory = async (req, res) => {
  try {
    const result = await getBuildingPrices();
    return res.status(200).send(result);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    return res.status(400).send(err.message);
  }
};
