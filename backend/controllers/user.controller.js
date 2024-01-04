import {
  createUserIfNotExist,
  toggleWarStatus,
  updateWalletPasswordAsked,
  updateBalance as updateBalanceService,
  getUserRankAndReward,
  updateLastOnlineTime,
  applyInviteCode,
} from '../services/user.service.js';
import { getWarHistory, getWarHistoryDetail } from '../services/warSnapshot.service.js';

export const getMe = async (req, res) => {
  try {
    await createUserIfNotExist(req.userId);
    return res.sendStatus(200);
  } catch (err) {
    console.log({ err });
    return res.status(400).send(err);
  }
};

export const toggleWar = async (req, res) => {
  try {
    await toggleWarStatus(req.userId, req.body.war);
    return res.sendStatus(200);
  } catch (err) {
    console.log({ err });
    return res.status(400).send(err);
  }
};

export const applyReferralCode = async (req, res) => {
  try {
    await applyInviteCode(req.userId, req.body.code);
    return res.sendStatus(200);
  } catch (err) {
    console.log({ err });
    return res.status(400).send(err.message);
  }
};

export const getUserWarHistory = async (req, res) => {
  try {
    const history = await getWarHistory(req.userId);
    return res.status(200).send(history);
  } catch (err) {
    console.log({ err });
    return res.status(400).send(err);
  }
};

export const getUserWarHistoryDetail = async (req, res) => {
  try {
    const { warSnapshotId, warResultId } = req.params;
    const data = await getWarHistoryDetail({ warSnapshotId, warResultId });
    return res.status(200).send(data);
  } catch (err) {
    console.log({ err });
    return res.status(400).send(err);
  }
};

export const completeAskingWalletPassword = async (req, res) => {
  try {
    await updateWalletPasswordAsked(req.userId);
    return res.sendStatus(200);
  } catch (err) {
    console.log({ err });
    return res.status(400).send(err);
  }
};

export const updateBalance = async (req, res) => {
  try {
    await updateBalanceService(req.userId);
    return res.sendStatus(200);
  } catch (err) {
    console.log({ err });
    return res.status(400).send(err);
  }
};

export const getRank = async (req, res) => {
  try {
    const data = await getUserRankAndReward(req.userId);
    return res.status(200).send(data);
  } catch (err) {
    console.log({ err });
    return res.status(400).send(err);
  }
};

export const setLastOnlineTime = async (req, res) => {
  try {
    await updateLastOnlineTime(req.userId);
    return res.sendStatus(200);
  } catch (err) {
    console.log({ err });
    return res.status(400).send(err);
  }
};
