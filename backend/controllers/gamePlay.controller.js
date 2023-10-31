import { getLeaderboard } from '../services/gamePlay.service.js';

export const getGamePlayLeaderboard = async (req, res) => {
  try {
    const data = await getLeaderboard();
    return res.status(200).send(data);
  } catch (err) {
    return res.status(400).send(err.message);
  }
};
