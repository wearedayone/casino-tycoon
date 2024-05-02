import { verifyMessage } from '@ethersproject/wallet';

import admin, { firestore, auth } from '../configs/firebase.config.js';

export const createUser = async ({ message, signature }) => {
  const recoveredAddress = verifyMessage(message, signature).toLowerCase();

  const snapshot = await firestore.collection('user').doc(recoveredAddress).get();
  if (!snapshot.exists) {
    await firestore.collection('user').doc(recoveredAddress).set({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      twitter: null,
      address: recoveredAddress,
    });
  }

  const token = await auth.createCustomToken(recoveredAddress);

  return { token };
};
