import admin, { firestore } from '../configs/admin.config.js';

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
      console.log('update user', user.userId);
      const gamePlay = await firestore
        .collection('gamePlay')
        .where('userId', '==', user.userId)
        .where('seasonId', '==', 'X6RRmbbG9kWh7VnqJDC9')
        .limit(1)
        .get();

      await firestore
        .collection('user')
        .doc(user.userId)
        .update({
          avatarURL_small: user.avatarURL_Small,
          avatarURL_big: user.avatarURL_Small.replace('_normal', '_bigger'),
        });
      if (!gamePlay.empty) {
        console.log('update gamePlay', gamePlay.docs[0].id);
        await firestore
          .collection('gamePlay')
          .doc(gamePlay.docs[0].id)
          .update({
            avatarURL_small: user.avatarURL_Small,
            avatarURL_big: user.avatarURL_Small.replace('_normal', '_bigger'),
            // avatarURL_Small: admin.firestore.FieldValue.delete(),
          });
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
