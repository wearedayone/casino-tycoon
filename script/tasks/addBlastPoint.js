import { firestore } from '../configs/admin.config.js';
import { getActiveSeasonId } from '../utils/utils.js';

const main = async () => {
  const activeSeasonId = await getActiveSeasonId();
  await firestore.collection('season').doc(activeSeasonId).update({
    blastPointBalance: 0,
  });

  const gamePlay = await firestore.collection('gamePlay').where('seasonId', '==', activeSeasonId).get();
  const promises = gamePlay.docs.map((doc) => doc.ref.update({ blastPointReward: 0 }));
  await Promise.all(promises);
};

main()
  .then(() => console.log('done!'))
  .catch(console.error);
