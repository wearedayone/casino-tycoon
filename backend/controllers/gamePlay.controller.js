import {
  getLeaderboard,
  getNextWarSnapshotUnixTime,
  updateLastTimeSeenWarResult,
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
