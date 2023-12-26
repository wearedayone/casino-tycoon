import { getActiveSeason } from '../services/season.service.js';

export const getRankingRewards = async (req, res) => {
  try {
    const { rankingRewards, leaderboardConfig } = await getActiveSeason(req.userId);

    return res.status(200).send({ rankingRewards, leaderboardConfig });
  } catch (err) {
    return res.status(400).send(err.message);
  }
};
