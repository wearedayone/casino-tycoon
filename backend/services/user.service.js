import { faker } from '@faker-js/faker';

import admin, { firestore } from '../configs/firebase.config.js';
import { getActivePoolId } from './pool.service.js';
import environments from '../utils/environments.js';
import privy from '../configs/privy.config.js';

const { NETWORK_ID } = environments;

export const createUserIfNotExist = async (userId) => {
  console.log({ function: 'createUserIfNotExist', userId });
  const snapshot = await firestore.collection('user').doc(userId).get();
  const user = await privy.getUser(userId);
  console.log({ user, linkedAccounts: user.linkedAccounts });
  if (!snapshot.exists) {
    const user = await privy.getUser(userId);
    console.log({ user });

    const { email, wallet, twitter } = user;
    // create user
    const username = (twitter ? twitter.name : email?.address) ?? faker.internet.userName();
    console.log({ username });
    const avatarURL = `https://placehold.co/400x400/1e90ff/FFF?text=${username[0].toUpperCase()}`;
    console.log({
      email: email ?? '',
      wallet: { address: wallet.address },
      // twitter,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      username,
      avatarURL,
      point: 0,
      balances: [
        { networkId: NETWORK_ID, token: 'ETH', balance: 0 },
        { networkId: NETWORK_ID, token: 'CHIP', balance: 0 },
      ],
    });
    await firestore
      .collection('user')
      .doc(userId)
      .set({
        email: email ?? '',
        wallet: { address: wallet.address },
        // twitter,
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
