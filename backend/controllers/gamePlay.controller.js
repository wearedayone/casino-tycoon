import { getLeaderboard, getNextWarSnapshotUnixTime } from '../services/gamePlay.service.js';

export const getGamePlayLeaderboard = async (req, res) => {
  try {
    const data = await getLeaderboard();
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
