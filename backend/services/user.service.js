import { faker } from '@faker-js/faker';
import { formatEther } from '@ethersproject/units';

import admin, { firestore } from '../configs/firebase.config.js';
import privy from '../configs/privy.config.js';
import alchemy from '../configs/alchemy.config.js';
import { getActiveSeason, getActiveSeasonId } from './season.service.js';
import { initTransaction, validateNonWeb3Transaction } from './transaction.service.js';
import environments from '../utils/environments.js';
import { calculateReward, generateCode } from '../utils/formulas.js';

const { NETWORK_ID } = environments;
const CODE_LENGTH = 10;

const createGamePlayIfNotExist = async (userId) => {
  const seasonId = await getActiveSeasonId();
  const snapshot = await firestore
    .collection('gamePlay')
    .where('userId', '==', userId)
    .where('seasonId', '==', seasonId)
    .get();
  if (snapshot.empty) {
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
      active: false,
    });
  }
};

export const createUserIfNotExist = async (userId) => {
  console.log({ function: 'createUserIfNotExist', userId });
  const snapshot = await firestore.collection('user').doc(userId).get();
  const user = await privy.getUser(userId);
  // console.log({ user });
  if (!snapshot.exists) {
    const { wallet, twitter } = user;
    // create user
    const username = twitter ? twitter.username : faker.internet.userName();
    const avatarURL = `https://placehold.co/400x400/1e90ff/FFF?text=${username[0].toUpperCase()}`;
    let validReferralCode = false;
    let referralCode = generateCode(CODE_LENGTH);
    while (!validReferralCode) {
      const code = await firestore.collection('user').where('referralCode', '==', referralCode).limit(1).get();
      if (code.empty) {
        validReferralCode = true;
      } else {
        referralCode = generateCode(CODE_LENGTH);
      }
    }

    await firestore
      .collection('user')
      .doc(userId)
      .set({
        address: wallet?.address?.toLocaleLowerCase() || '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        username,
        avatarURL,
        tokenBalance: 0,
        ETHBalance: 0,
        walletPasswordAsked: false,
        referralCode,
      });
  } else {
    const { wallet } = user;
    if (wallet) {
      const ethersProvider = await alchemy.config.getProvider();
      const value = await ethersProvider.getBalance(user.wallet.address);
      console.log(formatEther(value));
      const { ETHBalance } = snapshot.data();
      if (ETHBalance !== Number(formatEther(value))) {
        await firestore
          .collection('user')
          .doc(userId)
          .update({
            address: wallet?.address?.toLocaleLowerCase() || '',
            ETHBalance: Number(formatEther(value)),
          });
      }
    }
  }

  await createGamePlayIfNotExist(userId);
};

export const toggleWarStatus = async (userId, isWarEnabled) => {
  const transaction = await initTransaction({ userId, type: 'war-switch', isWarEnabled });
  await validateNonWeb3Transaction({ userId, transactionId: transaction.id });
};

export const updateWalletPasswordAsked = async (userId) => {
  await firestore.collection('user').doc(userId).update({ walletPasswordAsked: true });
};

export const getUserDisplayInfos = async (userId) => {
  const snapshot = await firestore.collection('user').doc(userId).get();

  if (snapshot.empty) return null;

  const { avatarURL, username } = snapshot.data();
  return { id: snapshot.id, avatarURL, username };
};

export const updateBalance = async (userId) => {
  const snapshot = await firestore.collection('user').doc(userId).get();
  const { ETHBalance, address } = snapshot.data();
  const ethersProvider = await alchemy.config.getProvider();
  const value = await ethersProvider.getBalance(address);

  if (ETHBalance !== formatEther(value)) {
    await firestore
      .collection('user')
      .doc(userId)
      .update({
        ETHBalance: formatEther(value),
      });
  }
};

// TODO: might need update flow to store leaderboard
// in another collection for easier query and snapshot listen
export const getUserRankAndReward = async (userId) => {
  const activeSeason = await getActiveSeason();

  const gamePlaySnapshot = await firestore
    .collection('gamePlay')
    .where('seasonId', '==', activeSeason.id)
    .orderBy('networth', 'desc')
    .orderBy('createdAt', 'asc')
    .get();

  const rankIndex = gamePlaySnapshot.docs.findIndex((item) => item.data().userId === userId);
  if (rankIndex !== -1) {
    const reward = calculateReward(activeSeason.prizePool, activeSeason.rankingRewards, rankIndex);
    return { rank: rankIndex + 1, reward, totalPlayers: gamePlaySnapshot.docs.length };
  }

  return null;
};

export const updateLastOnlineTime = async (userId) => {
  await firestore
    .collection('user')
    .doc(userId)
    .update({ lastOnlineTime: admin.firestore.FieldValue.serverTimestamp() });
};

export const applyInviteCode = async (userId, code) => {
  const appliedCode = code.trim().toLowerCase();
  const referrerSnapshot = await firestore.collection('user').where('referralCode', '==', appliedCode).get();
  if (!referrerSnapshot.size) throw new Error('Invalid invite code');

  const userRef = firestore.collection('user').doc(userId);
  const user = await userRef.get();
  const { referralCode, inviteCode } = user.data();
  if (referralCode === appliedCode) throw new Error('Cannot apply your own invite code');
  if (inviteCode) throw new Error('Cannot apply more than one invite code');

  await userRef.update({ inviteCode: appliedCode });
};
