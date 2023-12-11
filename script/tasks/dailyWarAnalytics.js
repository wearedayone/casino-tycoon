import fs from 'fs';
import { firestore } from '../configs/admin.config.js';
import { getActiveSeason } from '../utils/utils.js';

const main = async () => {
  const activeSeason = await getActiveSeason();
  const { id: activeSeasonId, machine, worker } = activeSeason;

  const snapshot = await firestore.collection('warSnapshot').doc('20231208').get();
  const doc = { id: snapshot.id, ...snapshot.data() };
  const { bonus } = doc;

  const users = [];
  for (const userId of Object.keys(bonus)) {
    if (bonus[userId] < 0) continue;
    const userSnapshot = await firestore.collection('user').doc(userId).get();
    const { username, address } = userSnapshot.data();

    const userGamePlaySnapshot = await firestore
      .collection('gamePlay')
      .where('userId', '==', userId)
      .where('seasonId', '==', activeSeasonId)
      .get();
    const userGamePlay = { id: userGamePlaySnapshot.docs[0].id, ...userGamePlaySnapshot.docs[0].data() };
    const userDailyIncome =
      machine.dailyReward * userGamePlay.numberOfMachines + worker.dailyReward * userGamePlay.numberOfWorkers;
    users.push({
      userId,
      username,
      address,
      received: bonus[userId],
      correctReceiveAmount: userDailyIncome,
    });
  }

  fs.writeFileSync('./daily-war-2023-12-08.json', JSON.stringify(users), { encoding: 'utf-8' });
};

main();
