import { faker } from '@faker-js/faker';
import { formatEther } from '@ethersproject/units';
import chunk from 'lodash.chunk';

import admin, { firestore } from '../configs/firebase.config.js';
import privy from '../configs/privy.config.js';
import alchemy from '../configs/alchemy.config.js';
import { getActiveSeason } from './season.service.js';
import { getLeaderboard } from './gamePlay.service.js';
import { generateCode } from '../utils/formulas.js';

const CODE_LENGTH = 10;

const createGamePlayIfNotExist = async (userId, isWhitelisted) => {
  const season = await getActiveSeason();
  const snapshot = await firestore
    .collection('gamePlay')
    .where('userId', '==', userId)
    .where('seasonId', '==', season.id)
    .get();
  if (snapshot.empty) {
    await firestore.collection('gamePlay').add({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      userId,
      seasonId: season.id,
      networth: season.worker.networth,
      numberOfMachines: 0,
      numberOfWorkers: 1,
      numberOfBuildings: 0,
      lastClaimTime: admin.firestore.FieldValue.serverTimestamp(),
      point: 0,
      pendingReward: 0,
      startRewardCountingTime: admin.firestore.FieldValue.serverTimestamp(),
      active: false,
      isWhitelisted,
      whitelistAmountMinted: 0,
    });

    await firestore.collection('warDeployment').add({
      userId,
      seasonId: season.id,
      numberOfMachinesToEarn: 0,
      numberOfMachinesToAttack: 0,
      numberOfMachinesToDefend: 0,
      attackUserId: null,
    });
  }
};

export const createUserIfNotExist = async (userId) => {
  console.log({ function: 'createUserIfNotExist', userId });
  const snapshot = await firestore.collection('user').doc(userId).get();
  const user = await privy.getUser(userId);

  const whitelistSnapshot = await firestore.collection('whitelisted').get();
  const whitelistedUsernames = whitelistSnapshot.docs.map((doc) => doc.data().username);

  const isWhitelisted = whitelistedUsernames.includes(user?.twitter?.username);
  const { wallet, twitter } = user;

  if (!snapshot.exists) {
    // create user
    const username = twitter ? twitter.username : faker.internet.userName();
    const avatarURL =
      twitter.profilePictureUrl || `https://placehold.co/400x400/1e90ff/FFF?text=${username[0].toUpperCase()}`;
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

    const numberOfUserSnapshot = await firestore.collection('user').count().get();
    const numberOfUsers = numberOfUserSnapshot.data().count;

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
        isWhitelisted,
        walletPasswordAsked: false,
        referralCode,
        referralTotalReward: 0,
        referralTotalDiscount: 0,
        code: numberToCodeString(numberOfUsers + 1),
        completedTutorial: false,
      });
  } else {
    const { ETHBalance, avatarURL } = snapshot.data();
    // check if user has twitter avatar now
    if (avatarURL.startsWith('https://placehold.co') && twitter.profilePictureUrl)
      await firestore.collection('user').doc(userId).update({
        avatarURL: twitter.profilePictureUrl,
      });

    if (wallet) {
      const ethersProvider = await alchemy.config.getProvider();
      const value = await ethersProvider.getBalance(user.wallet.address);
      console.log(formatEther(value));
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

  await createGamePlayIfNotExist(userId, isWhitelisted);
};

export const updateWalletPasswordAsked = async (userId) => {
  await firestore.collection('user').doc(userId).update({ walletPasswordAsked: true });
};

export const getUserDisplayInfos = async (userId) => {
  const snapshot = await firestore.collection('user').doc(userId).get();

  if (!snapshot.exists) return null;

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
  const leaderboard = await getLeaderboard(userId);

  const user = leaderboard.find((item) => item.isUser);
  if (user) {
    const { rank, rankReward, reputationReward } = user;
    return { rank, rankReward, reputationReward, totalPlayers: leaderboard.length };
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
  if (!referrerSnapshot.size) throw new Error('API error: Invalid invite code');

  const userRef = firestore.collection('user').doc(userId);
  const user = await userRef.get();
  const { referralCode, inviteCode } = user.data();
  if (referralCode === appliedCode) throw new Error('API error: Cannot apply your own invite code');
  if (inviteCode) throw new Error('API error: Cannot apply more than one invite code');

  await userRef.update({ inviteCode: appliedCode });
};

export const getUserUsernames = async (userIds) => {
  const chunkIdsArrays = chunk(userIds, 10);

  const promises = chunkIdsArrays.map((ids) =>
    firestore.collection('user').where(admin.firestore.FieldPath.documentId(), 'in', ids).get()
  );
  const snapshots = await Promise.all(promises);

  const usernames = {};
  snapshots.map((snapshot) => snapshot.docs.map((doc) => (usernames[doc.id] = doc.data().username)));

  return usernames;
};

export const updateViewedTutorial = async (userId) => {
  await firestore.collection('user').doc(userId).update({ completedTutorial: true });
};

export const getUserByCode = async (code) => {
  const user = await firestore.collection('user').where('code', '==', code).limit(1).get();
  if (user.empty) return null;

  return { id: user.docs[0].id, ...user.docs[0].data() };
};

export const checkCodeDuplicate = async (userId) => {
  const user = await firestore.collection('user').doc(userId).get();
  if (user.exists) {
    const { code } = user.data();
    const snapshot = await firestore.collection('user').where('code', '==', code).get();
    if (snapshot.size) {
      const duplicateDocs = snapshot.docs.filter((doc) => doc.id !== userId);
      if (duplicateDocs.length) {
        const maxCodeUser = await firestore.collection('user').orderBy('code', 'desc').limit(1).get();
        const maxCode = maxCodeUser.docs[0]?.data()?.code;

        await user.ref.update({ code: numberToCodeString(Number(maxCode) + 1) });
      }
    }
  }
};

const numberToCodeString = (number) => {
  return `00000${number}`.slice(-6);
};
