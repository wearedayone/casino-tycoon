import admin, { firestore } from '../configs/admin.config.js';

const patchGamePlay = async () => {
  const systemSnapshot = await firestore.collection('system').doc('default').get();
  const { activeSeasonId } = systemSnapshot.data();

  const gamePlaySnapshot = await firestore.collection('gamePlay').where('seasonId', '==', activeSeasonId).get();
  console.log(`update GamePlay`);

  for (let gamePlay of gamePlaySnapshot.docs) {
    try {
      console.log('update user', gamePlay.data().username);

      await gamePlay.ref.update({
        pendingXToken: 0,
        startXTokenRewardCountingTime: admin.firestore.FieldValue.serverTimestamp(),
        tokenHoldingRewardMode: 'xGANG',
      });
    } catch (err) {
      console.error(`Error while update for ${gamePlay.data().username}`, err.message);
    }
  }
};

patchGamePlay()
  .then(process.exit)
  .catch((err) => console.error(err));
