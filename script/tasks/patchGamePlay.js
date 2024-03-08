import { firestore } from '../configs/admin.config.js';

const patchGamePlay = async () => {
  const userSnapshot = await firestore.collection('user').get();
  console.log(`update GamePlay`);
  const users = userSnapshot.docs.map((item) => ({
    userId: item.id,
    username: item.data().username,
    address: item.data().address,
    avatarURL: item.data().avatarURL ?? '',
    avatarURL_Small: item.data().avatarURL_Small ?? '',
  }));

  for (const user of users) {
    try {
      const { username } = user;
      const gamePlay = await firestore
        .collection('gamePlay')
        .where('userId', '==', user.userId)
        .where('seasonId', '==', 'X6RRmbbG9kWh7VnqJDC9')
        .limit(1)
        .get();

      if (!gamePlay.empty) {
        await firestore
          .collection('gamePlay')
          .doc(gamePlay.docs[0].id)
          .update({ username, avatarURL: user.avatarURL, avatarURL_Small: user.avatarURL_Small });
      }
    } catch (err) {
      console.error(`Error while update for ${user.username}`, err.message);
      continue;
    }
  }
};

patchGamePlay()
  .then(process.exit)
  .catch((err) => console.error(err));
