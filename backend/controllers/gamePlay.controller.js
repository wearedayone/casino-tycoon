import {
  getLeaderboard,
  getNextWarSnapshotUnixTime,
  updateLastTimeSeenWarResult,
  updateUserWarDeployment,
  updateUserWarAttackUser,
  getUserWarDeployment,
  getNextSpinIncrementUnixTime,
  upgradeMachine,
  upgradeBuilding,
  retireGamePlay,
} from '../services/gamePlay.service.js';
import logger from '../utils/logger.js';

export const getGamePlayLeaderboard = async (req, res) => {
  try {
    const data = await getLeaderboard(req.userId);
    return res.status(200).send(data);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};

export const getNextWarSnapshot = async (req, res) => {
  try {
    const data = await getNextWarSnapshotUnixTime();
    return res.status(200).send({ time: data });
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};

export const updateLastTimeSeenGangWarResult = async (req, res) => {
  try {
    await updateLastTimeSeenWarResult(req.userId);
    return res.sendStatus(200);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
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
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
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
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};

export const getWarDeployment = async (req, res) => {
  try {
    const data = await getUserWarDeployment(req.userId);
    return res.status(200).send(data);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};

export const getNextSpinIncrement = async (req, res) => {
  try {
    const data = await getNextSpinIncrementUnixTime();
    return res.status(200).send({ time: data });
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};

export const upgradeUserMachines = async (req, res) => {
  try {
    await upgradeMachine(req.userId);
    return res.sendStatus(200);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};

export const upgradeUserBuildings = async (req, res) => {
  try {
    await upgradeBuilding(req.userId);
    return res.sendStatus(200);
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};

export const retire = async (req, res) => {
  try {
    const data = { ...req.body, userId: req.userId };
    const { txnHash } = await retireGamePlay(data);
    return res.status(200).send({ txnHash });
  } catch (err) {
    console.error(err);
    logger.error(err.message);
    const message = err.message.startsWith('API error') ? err.message : 'Something is wrong';
    return res.status(400).send(message);
  }
};
