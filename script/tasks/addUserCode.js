import admin, { firestore } from '../configs/admin.config.js';

const main = async () => {
  const userSnapshot = await firestore.collection('user').get();

  userSnapshot.docs.map(async (doc, index) => {
    await doc.ref.update({ code: numberToCodeString(index + 1) });
  });

  await firestore.collection('system').doc('user-count').update({ value: userSnapshot.docs.length });
};

const numberToCodeString = (number) => {
  return `00000${number}`.slice(-6);
};

main()
  .then(() => console.log('done'))
  .catch((err) => console.error(err));
