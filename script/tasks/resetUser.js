import admin, { firestore } from '../configs/admin.config.js';

const main = async () => {
  const userSnapshot = await firestore.collection('user').get();

  userSnapshot.docs.map(async (doc, index) => {
    await doc.ref.update({ completedTutorial: true });
  });
  const oldDate = 1711213702000;
  const gamePlaySnapshot = await firestore.collection('gamePlay').where('seasonId', '==', '2xLLEu6nnJGz3kf0MZHU').get();
  gamePlaySnapshot.docs.map(async (doc, index) => {
    await doc.ref.update({ lastTimeSwapXToken: admin.firestore.Timestamp.fromMillis(oldDate) });
  });
};

main()
  .then(() => console.log('done'))
  .catch((err) => console.error(err));
