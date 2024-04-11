import admin, { firestore } from '../configs/admin.config.js';
import { getActiveSeason } from '../utils/utils.js';

const main = async () => {
  const { id } = await getActiveSeason();

  await firestore
    .collection('season')
    .doc(id)
    .update({
      swapXTokenGapInSeconds: 5 * 24 * 60 * 60,
    });

  const gamePlay = await firestore.collection('gamePlay').where('seasonId', '==', id).get();
  const promises = gamePlay.docs.map((doc) =>
    doc.ref.update({ lastTimeSwapXToken: admin.firestore.Timestamp.fromMillis(0) })
  );
  await Promise.all(promises);
};

main()
  .then(() => console.log('done!'))
  .catch(console.error);
