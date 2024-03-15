import { firestore } from '../configs/admin.config.js';
import whitelisted from '../assets/jsons/whitelisted.json' assert { type: 'json' };

const getActiveSeasonId = async () => {
  const snapshot = await firestore.collection('system').doc('default').get();
  const configs = snapshot.data();

  return configs.activeSeasonId;
};

const checkExistedWhitelistedUser = async ({ allUsers, username, seasonId }) => {
  try {
    // console.log(`Start importing user ${username}`);
    const user = allUsers.find((u) => !!u.username && u.username.toLowerCase() == username.toLowerCase());

    const existedDoc = await firestore.collection('whitelisted').where('username', '==', username.toLowerCase()).get();
    if (existedDoc.empty) {
      console.log(`Add whitelist: ${username}`);
      await firestore.collection('whitelisted').add({ username: username.toLowerCase() });
    }
    if (!!user) {
      // update user isWhitelisted
      if (!user.isWhitelisted) {
        console.log(`Update user     whitelist: ${username}`);
        await firestore.collection('user').doc(user.userId).update({ isWhitelisted: true });
      }

      const gamePlaySnapshot = await firestore
        .collection('gamePlay')
        .where('seasonId', '==', seasonId)
        .where('userId', '==', user.userId)
        .limit(1)
        .get();
      if (!gamePlaySnapshot.empty) {
        const { isWhitelisted } = gamePlaySnapshot.docs[0].data();
        if (!isWhitelisted) {
          console.log(`Update gameplay whitelist: ${username}`);
          await gamePlaySnapshot.docs[0].ref.update({ isWhitelisted: true });
        }
      }
    }

    // console.log(`Completed importing user ${username}`);
  } catch (err) {
    console.error(`Error while importing user ${username}`);
    console.error(err);
  }
};

const main = async () => {
  console.log('start import whitelist user');
  const seasonId = await getActiveSeasonId();
  const snapshot = await firestore.collection('user').get();
  const allUsers = snapshot.docs.map((doc) => {
    const { username, isWhitelisted } = doc.data();
    const userId = doc.id;
    return { userId, username, isWhitelisted };
  });
  for (let username of whitelisted) {
    await checkExistedWhitelistedUser({ allUsers, username, seasonId });
  }
  console.log('done');
};

main();
