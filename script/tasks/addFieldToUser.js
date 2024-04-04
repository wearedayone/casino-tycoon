import { firestore } from '../configs/admin.config.js';

const main = async () => {
  const userSnapshot = await firestore.collection('user').get();

  userSnapshot.docs.map(async (doc, index) => {
    await doc.ref.update({ xTokenBalance: 0 });
  });
};

main()
  .then(() => console.log('done'))
  .catch((err) => console.error(err));
