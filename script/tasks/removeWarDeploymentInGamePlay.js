import admin, { firestore } from '../configs/admin.config.js';

const main = async () => {
  const snapshot = await firestore.collection('gamePlay').get();

  const promises = snapshot.docs.map((doc) => doc.ref.update({ warDeployment: admin.firestore.FieldValue.delete() }));
  await Promise.all(promises);
};

main();
