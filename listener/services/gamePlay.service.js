import admin, { firestore } from '../configs/firebase.config.js';
import { getActiveSeason } from './season.service.js';

export const getUpdatedHoldingReward = async ({ userId, tokenBalance }) => {
  const activeSeason = await getActiveSeason();
  const gamePlaySnapshot = await firestore
    .collection('gamePlay')
    .where('userId', '==', userId)
    .where('seasonId', '==', activeSeason.id)
    .limit(1)
    .get();

  const gamePlay = gamePlaySnapshot.docs[0];
  const { pendingXToken, startXTokenRewardCountingTime } = gamePlay.data();
  const { xTokenRewardPercent } = activeSeason.tokenHoldingRewardConfig;

  const now = Date.now();

  const start = startXTokenRewardCountingTime.toDate().getTime();
  const diffInDays = (now - start) / (24 * 60 * 60 * 1000);
  const dailyXTokenReward = tokenBalance * xTokenRewardPercent;
  const generatedReward = Math.round(diffInDays * dailyXTokenReward * 1000) / 1000;
  const newPendingXToken = pendingXToken + generatedReward;

  return {
    gamePlayRef: gamePlay.ref,
    data: {
      pendingXToken: newPendingXToken,
      startXTokenRewardCountingTime: admin.firestore.Timestamp.fromMillis(now),
    },
  };
};
