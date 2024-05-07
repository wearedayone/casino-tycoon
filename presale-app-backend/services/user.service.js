import { verifyMessage } from '@ethersproject/wallet';

import admin, { firestore, auth } from '../configs/firebase.config.js';

export const createUser = async ({ message, signature }) => {
  const recoveredAddress = verifyMessage(message, signature).toLowerCase();

  const snapshot = await firestore.collection('user').doc(recoveredAddress).get();
  if (!snapshot.exists) {
    await firestore
      .collection('user')
      .doc(recoveredAddress)
      .set({
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        socials: { twitter: { verified: false } },
        address: recoveredAddress,
        username: null,
        mintedPhases: {},
      });
  }

  const token = await auth.createCustomToken(recoveredAddress);

  return { token };
};

export const isWhitelisted = async (address, phaseId) => {
  const user = await firestore.collection('user').doc(address).get();
  if (!user.exists) return false;
  const { username } = user.data();

  const whitelisted = await firestore.collection('whitelisted-user').where('username', '==', username).get();
  const whitelistedPhaseIds = whitelisted.docs.map((doc) => doc.data().phaseId);

  return whitelistedPhaseIds.includes(`${phaseId}`);
};
