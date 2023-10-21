import { faker } from '@faker-js/faker';

import admin, { firestore } from '../configs/firebase.config.js';
import { getActivePoolId } from './pool.service.js';
import environments from '../utils/environments.js';

const { NETWORK_ID } = environments;

export const createUserIfNotExist = async (userId) => {
  const snapshot = await firestore.collection('users').doc(userId).get();
  if (!snapshot.exists) {
    // create user
    const username = faker.internet.userName();
    const avatarURL = `https://placehold.co/400x400/1e90ff/FFF?text=${username[0].toUpperCase()}`;
    await firestore
      .collection('user')
      .doc(userId)
      .set({
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        username,
        avatarURL,
        point: 0,
        balances: [
          { networkId: NETWORK_ID, token: 'ETH', balance: 0 },
          { networkId: NETWORK_ID, token: 'CHIP', balance: 0 },
        ],
      });

    // create gamePlay
    const poolId = await getActivePoolId();
    await firestore.collection('gamePlay').add({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      userId,
      poolId,
      networth: 0,
      numberOfMachines: 0,
      numberOfWorkers: 0,
      numberOfBuildings: 0,
      lastClaimTime: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
};
