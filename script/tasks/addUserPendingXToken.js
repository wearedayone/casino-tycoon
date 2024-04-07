import admin, { firestore } from '../configs/admin.config.js';

const main = async () => {
  const gamePlaySnapshot = await firestore.collection('gamePlay').get();

  const promises = gamePlaySnapshot.docs.map((doc) => {
    doc.ref.update({
      startXTokenCountingTime: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  await Promise.all(promises);
};

main()
  .then(() => console.log('done'))
  .catch((err) => console.error(err));
