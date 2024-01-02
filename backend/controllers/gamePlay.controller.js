import {
  getLeaderboard,
  getNextWarSnapshotUnixTime,
  updateLastTimeSeenWarResult,
  getAllActiveGamePlay,
  updateUserWarDeployment,
  updateUserWarAttackUser,
} from '../services/gamePlay.service.js';

export const getGamePlayLeaderboard = async (req, res) => {
  try {
    const data = await getLeaderboard(req.userId);
    return res.status(200).send(data);
  } catch (err) {
    return res.status(400).send(err.message);
  }
};

export const getNextWarSnapshot = async (req, res) => {
  try {
    const data = await getNextWarSnapshotUnixTime();
    return res.status(200).send({ time: data });
  } catch (err) {
    return res.status(400).send(err.message);
  }
};

export const updateLastTimeSeenGangWarResult = async (req, res) => {
  try {
    await updateLastTimeSeenWarResult(req.userId);
    return res.sendStatus(200);
  } catch (err) {
    return res.status(400).send(err.message);
  }
};

export const getTotalVoters = async (req, res) => {
  try {
    const data = await getAllActiveGamePlay();
    return res.status(200).send({ count: data });
  } catch (err) {
    return res.status(400).send(err.message);
  }
};

export const updateUserWarMachines = async (req, res) => {
  try {
    await updateUserWarDeployment({
      userId: req.userId,
      ...req.body,
    });
    return res.sendStatus(200);
  } catch (err) {
    return res.status(400).send(err.message);
  }
};

export const updateUserWarAttack = async (req, res) => {
  try {
    await updateUserWarAttackUser({
      userId: req.userId,
      ...req.body,
    });
    return res.sendStatus(200);
  } catch (err) {
    return res.status(400).send(err.message);
  }
};
