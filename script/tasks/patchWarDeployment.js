import admin, { firestore } from '../configs/admin.config.js';

const main = async () => {
  const snapshot = await firestore.collection('gamePlay').get();

  const promises = [];
  for (const item of snapshot.docs) {
    const { userId, seasonId, warDeployment } = item.data();

    promises.push(
      firestore.collection('warDeployment').add({
        userId,
        seasonId,
        ...(warDeployment || {}),
      })
    );
  }

  await Promise.all(promises);
};

main();
