import { firestore } from '../configs/admin.config.js';
import { getActiveSeason } from '../utils/utils.js';

const main = async () => {
  const { id } = await getActiveSeason();

  const gamePlay = await firestore.collection('gamePlay').where('seasonId', '==', id).get();
  const promises = gamePlay.docs.map((doc) => doc.ref.update({ numberOfSpins: 10 }));
  await Promise.all(promises);
};

main()
  .then(() => console.log('done!'))
  .catch(console.error);
