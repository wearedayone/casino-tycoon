import { firestore } from '../configs/admin.config.js';
import whitelisted from '../assets/jsons/whitelisted.json' assert { type: 'json' };

const getActiveSeasonId = async () => {
  const snapshot = await firestore.collection('system').doc('default').get();
  const configs = snapshot.data();

  return configs.activeSeasonId;
};

const checkExistedWhitelistedUser = async (username) => {
  try {
    await firestore.collection('whitelisted').add({ username });

    const snapshot = await firestore.collection('user').where('username', '==', username).limit(1).get();
    if (!snapshot.empty) {
      // update user isWhitelisted
      await snapshot.docs[0].ref.update({ isWhitelisted: true });

      const seasonId = await getActiveSeasonId();
      const gamePlaySnapshot = await firestore
        .collection('gamePlay')
        .where('seasonId', '==', seasonId)
        .where('userId', '==', snapshot.docs[0].id)
        .limit(1)
        .get();
      if (!gamePlaySnapshot.empty) {
        await gamePlaySnapshot.docs[0].ref.update({ isWhitelisted: true });
      }
    }
    console.error(`Completed importing user ${username}`);
  } catch (err) {
    console.error(`Error while importing user ${username}`);
    console.error(err);
  }
};

const main = async () => {
  console.log('start import whitelist user');
  const promises = whitelisted.map((username) => checkExistedWhitelistedUser(username));
  await Promise.all(promises);
  console.log('done');
};

main();
