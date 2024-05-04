import * as services from '../services/wallet.service.js';
import logger from '../utils/logger.js';

export const getSignatureMint = async (req, res) => {
  try {
    const { phaseId, amount } = req.body;
    const data = await services.getSignatureMint({
      address: req.userId,
      phaseId,
      amount,
    });
    return res.status(200).send(data);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    return res.status(400).send(err.message);
  }
};
