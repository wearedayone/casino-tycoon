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

export const isWhitelisted = async (address) => {
  const user = await firestore.collection('user').doc(address).get();
  if (!user.exists) return false;
  const { username } = user.data();

  const whitelisted = await firestore.collection('whitelisted').get();
  const whitelistedUsernames = whitelisted.docs.map((doc) => doc.data().username);

  return whitelistedUsernames.includes(username);
};

export const isFromSeasonOne = async (address) => {
  const user = await firestore.collection('user').doc(address).get();
  if (!user.exists) return false;
  const { username } = user.data();

  const season1Users = await firestore.collection('season-1-user').get();
  const season1Usernames = season1Users.docs.map((doc) => doc.data().username);

  return season1Usernames.includes(username);
};
