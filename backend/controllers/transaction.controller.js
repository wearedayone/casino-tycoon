import {
  initTransaction,
  validateTxnHash,
  validateDailySpinTxnAndReturnSpinResult,
  claimToken as claimTokenService,
  claimPendingXToken,
  finishClaimToken,
  getWorkerPriceChart,
  getBuildingPriceChart,
  getMachinePriceChart,
  buyAssetsWithXToken,
  convertXTokenToToken,
} from '../services/transaction.service.js';
import logger from '../utils/logger.js';

export const create = async (req, res) => {
  try {
    const data = { ...req.body, userId: req.userId };
    const result = await initTransaction(data);
    return res.status(200).send(result);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};

export const validate = async (req, res) => {
  try {
    const data = { ...req.body, userId: req.userId };
    await validateTxnHash(data);
    return res.sendStatus(200);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};

export const validateDailySpin = async (req, res) => {
  try {
    const data = { ...req.body, userId: req.userId };
    const result = await validateDailySpinTxnAndReturnSpinResult(data);
    return res.status(200).send({ result });
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};

export const claimToken = async (req, res) => {
  try {
    const data = { ...req.body, userId: req.userId };
    const { address, claimedAmount, transactionId } = await claimTokenService(data);
    finishClaimToken({ address, claimedAmount, transactionId });
    return res.status(200).send({ claimedAmount });
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};

export const claimXTokenHoldingReward = async (req, res) => {
  try {
    const data = { ...req.body, userId: req.userId };
    const claimedAmount = await claimPendingXToken(data);
    return res.status(200).send({ claimedAmount });
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};

export const getWorkerPrices = async (req, res) => {
  try {
    const { timeMode } = req.query;
    const result = await getWorkerPriceChart({ timeMode });
    return res.status(200).send(result);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};

export const getBuildingPrices = async (req, res) => {
  try {
    const { timeMode } = req.query;
    const result = await getBuildingPriceChart({ timeMode });
    return res.status(200).send(result);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};

export const getMachinePrices = async (req, res) => {
  try {
    const { timeMode } = req.query;
    const result = await getMachinePriceChart({ timeMode });
    return res.status(200).send(result);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};

export const buyAssetsXToken = async (req, res) => {
  try {
    const { userId } = req;
    const { type, amount } = req.body;
    await buyAssetsWithXToken({ userId, type, amount });
    return res.sendStatus(200);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};

export const convertWeb2Token = async (req, res) => {
  try {
    const { userId } = req;
    const { amount } = req.body;
    const data = await convertXTokenToToken({ userId, amount });
    return res.status(200).send(data);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};
