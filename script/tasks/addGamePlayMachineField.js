import { firestore } from '../configs/admin.config.js';
import { getActiveSeason } from '../utils/utils.js';

const main = async () => {
  const { id, machine } = await getActiveSeason();

  const gamePlay = await firestore.collection('gamePlay').where('seasonId', '==', id).get();
  const promises = gamePlay.docs.map((doc) =>
    doc.ref.update({ machine: { level: 0, dailyReward: machine.dailyReward } })
  );
  await Promise.all(promises);
};

main()
  .then(() => console.log('done!'))
  .catch(console.error);
