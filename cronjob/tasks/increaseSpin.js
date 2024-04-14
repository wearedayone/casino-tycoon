import admin, { firestore } from '../configs/admin.config.js';

const increaseSpin = async () => {
  try {
    console.log('Increase spin for users');
    const gamePlays = await firestore.collection('gamePlay').where('active', '==', true).get();
    const promises = gamePlays.map((doc) => doc.ref.update({ numberOfSpins: admin.firestore.FieldValue.increment(1) }));
    await Promise.all(promises);
  } catch (err) {
    console.log(`Error in increasing spin: `, err);
  }
};

export default increaseSpin;
