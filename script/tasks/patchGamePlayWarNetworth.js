import admin, { firestore } from '../configs/admin.config.js';

const main = async () => {
  const systemSnapshot = await firestore.collection('system').doc('default').get();
  const { activeSeasonId } = systemSnapshot.data();
  const userSnapshot = await firestore.collection('user').get();
  console.log(`add field networthFromWar to all current gamePlay`);
  const users = userSnapshot.docs.map((item) => ({
    userId: item.id,
    username: item.data().username,
  }));

  for (const user of users) {
    try {
      console.log('update user', user.userId);
      const gamePlay = await firestore
        .collection('gamePlay')
        .where('userId', '==', user.userId)
        .where('seasonId', '==', activeSeasonId)
        .limit(1)
        .get();

      if (!gamePlay.empty && gamePlay.docs[0].data().networthFromWar === undefined) {
        console.log('update gamePlay', gamePlay.docs[0].id);
        await firestore.collection('gamePlay').doc(gamePlay.docs[0].id).update({
          networthFromWar: 0,
        });
      }
    } catch (err) {
      console.error(`Error while update for ${user.username}`, err.message);
      continue;
    }
  }
};

main()
  .then(process.exit)
  .catch((err) => console.error(err));
