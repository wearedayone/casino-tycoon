import { faker } from '@faker-js/faker';

import admin, { firestore } from '../configs/firebase.config.js';
import { getActiveSeasonId } from './season.service.js';
import environments from '../utils/environments.js';
import privy from '../configs/privy.config.js';

const { NETWORK_ID } = environments;

export const createUserIfNotExist = async (userId) => {
  console.log({ function: 'createUserIfNotExist', userId });
  const snapshot = await firestore.collection('user').doc(userId).get();
  // const user = await privy.getUser(userId);
  // console.log({ user });
  if (!snapshot.exists) {
    const user = await privy.getUser(userId);
    // console.log({ user });

    const { wallet, twitter } = user;
    // create user
    const username = twitter ? twitter.username : faker.internet.userName();
    const avatarURL = `https://placehold.co/400x400/1e90ff/FFF?text=${username[0].toUpperCase()}`;

    await firestore.collection('user').doc(userId).set({
      address: wallet.address,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      username,
      avatarURL,
      tokenBalance: 0,
      ETHBalance: 0,
    });

    // create gamePlay
    const seasonId = await getActiveSeasonId();
    await firestore.collection('gamePlay').add({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      userId,
      seasonId,
      networth: 0,
      numberOfMachines: 0,
      numberOfWorkers: 0,
      numberOfBuildings: 0,
      lastClaimTime: admin.firestore.FieldValue.serverTimestamp(),
      point: 0,
      war: false,
      pendingReward: 0,
      startRewardCountingTime: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
};
