import {
  createUserIfNotExist,
  updateWalletPasswordAsked,
  updateBalance as updateBalanceService,
  getUserRankAndReward,
  updateLastOnlineTime,
  applyInviteCode,
  updateViewedTutorial,
  getUserByCode,
  checkCodeDuplicate,
  getUserRankAndRewardV2,
} from '../services/user.service.js';
import { getWarHistory, getWarHistoryDetail } from '../services/warSnapshot.service.js';
import logger from '../utils/logger.js';

export const getMe = async (req, res) => {
  try {
    await createUserIfNotExist(req.userId);
    return res.sendStatus(200);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};

export const applyReferralCode = async (req, res) => {
  try {
    await applyInviteCode(req.userId, req.body.code);
    return res.sendStatus(200);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};

export const getUserWarHistory = async (req, res) => {
  try {
    const history = await getWarHistory(req.userId);
    return res.status(200).send(history);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};

export const getUserWarHistoryDetail = async (req, res) => {
  try {
    const { warSnapshotId, warResultId } = req.params;
    const data = await getWarHistoryDetail({ warSnapshotId, warResultId });
    return res.status(200).send(data);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};

export const completeAskingWalletPassword = async (req, res) => {
  try {
    await updateWalletPasswordAsked(req.userId);
    return res.sendStatus(200);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};

export const updateBalance = async (req, res) => {
  try {
    await updateBalanceService(req.userId);
    return res.sendStatus(200);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};

export const getRank = async (req, res) => {
  try {
    const data = await getUserRankAndRewardV2(req.userId);
    return res.status(200).send(data);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};

export const setLastOnlineTime = async (req, res) => {
  try {
    await updateLastOnlineTime(req.userId);
    return res.sendStatus(200);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};

export const completeTutorial = async (req, res) => {
  try {
    await updateViewedTutorial(req.userId);
    return res.sendStatus(200);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};

export const getUser = async (req, res) => {
  try {
    const result = await getUserByCode(req.query?.code || '');
    return res.status(200).send(result);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};

export const checkUserCode = async (req, res) => {
  try {
    await checkCodeDuplicate(req.userId);
    return res.sendStatus(200);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};
