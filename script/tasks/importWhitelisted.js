import { firestore } from '../configs/admin.config.js';
import lastedWhitelisted from '../assets/jsons/whitelisted.json' assert { type: 'json' };

const getActiveSeasonId = async () => {
  const snapshot = await firestore.collection('system').doc('default').get();
  const configs = snapshot.data();

  return configs.activeSeasonId;
};

const main = async () => {
  console.log('start import whitelisted users');
  const seasonId = await getActiveSeasonId();
  const whitelistSnapshot = await firestore.collection('whitelisted').get();
  const usersSnapshot = await firestore.collection('user').get();

  const currentWhitelist = whitelistSnapshot.docs.map((doc) => ({
    username: doc.data().username,
    usernameLowercase: doc.data().username.toLowerCase(),
  }));

  const users = usersSnapshot.docs.map((doc) => ({
    ref: doc.ref,
    id: doc.id,
    username: doc.data().username,
    isWhitelisted: doc.data().isWhitelisted,
    usernameLowercase: doc.data().username.toLowerCase(),
  }));

  for (let username of lastedWhitelisted) {
    try {
      const existedWhitelist = currentWhitelist.find(
        ({ usernameLowercase }) => usernameLowercase === username.toLowerCase()
      );
      if (!existedWhitelist) {
        const user = users.find(({ usernameLowercase }) => usernameLowercase === username.toLowerCase());

        // use user's twitter username if found
        const correctUsername = user?.username || username;
        await firestore.collection('whitelisted').add({ username: correctUsername });

        if (user) {
          // update user isWhitelisted
          await user.ref.update({ isWhitelisted: true });

          const gamePlaySnapshot = await firestore
            .collection('gamePlay')
            .where('seasonId', '==', seasonId)
            .where('userId', '==', user.id)
            .limit(1)
            .get();
          if (!gamePlaySnapshot.empty) {
            await gamePlaySnapshot.docs[0].ref.update({ isWhitelisted: true });
          }
        }
      }

      console.error(`Completed importing user ${username}`);
    } catch (err) {
      console.error(`Error while importing user ${username}`);
      console.error(err);
    }
  }
  console.log('done');
};

main();
