import { firestore } from '../configs/firebase.config.js';

export const getActivePoolId = async () => {
  const snapshot = await firestore.collection('system').doc('default').get();
  const configs = snapshot.data();

  return configs.activePoolId;
};
