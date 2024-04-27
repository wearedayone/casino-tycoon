import { firestore } from '../configs/admin.config.js';
import { getActiveSeason } from '../utils/utils.js';

const MAX_RETRY = 3;

const calculateUPoints = (networth, startTime, now) => {
  const diffInSeconds = (now - startTime) / 1000;
  const uPointReward = Math.floor((networth * diffInSeconds) / 86400);

  return uPointReward;
};

const updateUPoints = async () => {
  try {
    const activeSeason = await getActiveSeason();
    const { id: activeSeasonId, startTime } = activeSeason;

    const gamePlaySnapshot = await firestore.collection('gamePlay').where('seasonId', '==', activeSeasonId).get();
    const now = Date.now();

    const batch = firestore.batch();
    for (const gamePlay of gamePlaySnapshot.docs) {
      const { networth } = gamePlay.data();
      const uPointReward = calculateUPoints(networth, startTime.toDate().getTime(), now);
      const gamePlayRef = firestore.collection('gamePlay').doc(gamePlay.id);
      batch.update(gamePlayRef, {
        uPointReward,
      });
    }

    let retry = 0;
    let isSuccess = false;
    while (retry < MAX_RETRY && !isSuccess) {
      try {
        console.log(`Start updating uPointReward. Retry ${retry++} times.`);
        await batch.commit();
        isSuccess = true;
      } catch (err) {
        console.error(`Unsuccessful updating uPointReward: ${JSON.stringify(err)}`);
      }
    }

    if (!isSuccess) {
      throw new Error('API error: Error when updating uPointReward');
    }
  } catch (err) {
    console.log('Error uPointReward', err);
  }
};

export default updateUPoints;

// updateUPoints().then(() => console.log('OK!'));
