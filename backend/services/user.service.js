import { faker } from '@faker-js/faker';
import { formatEther } from '@ethersproject/units';
import chunk from 'lodash.chunk';

import admin, { firestore } from '../configs/firebase.config.js';
import privy from '../configs/privy.config.js';
import quickNode from '../configs/quicknode.config.js';
import { getActiveSeason } from './season.service.js';
import { getLeaderboard, getRank } from './gamePlay.service.js';
import { generateCode } from '../utils/formulas.js';
import { getTokenBalance } from './worker.service.js';

const CODE_LENGTH = 10;

const createGamePlayIfNotExist = async (userId, isWhitelisted) => {
  const season = await getActiveSeason();

  const snapshot = await firestore
    .collection('gamePlay')
    .where('userId', '==', userId)
    .where('seasonId', '==', season.id)
    .get();
  if (snapshot.empty) {
    const user = await firestore.collection('user').doc(userId).get();
    const userData = user.data();

    let tokenBalance = 0;
    let address = userData?.address ?? '';
    try {
      const tba = await getTokenBalance({ address });
      tokenBalance = Number(formatEther(tba));
    } catch (ex) {
      console.log(ex);
    }

    await Promise.all([
      firestore.collection('user').doc(userId).update({ tokenBalance: tokenBalance }),
      firestore.collection('gamePlay').add({
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        userId,
        seasonId: season.id,
        networth: season.worker.networth,
        networthFromWar: 0,
        numberOfMachines: 0,
        numberOfWorkers: 0,
        numberOfBuildings: 0,
        numberOfSpins: 0,
        machine: { level: 0, dailyReward: season.machine.dailyReward },
        building: { level: 0, machineCapacity: season.building.initMachineCapacity },
        lastClaimTime: admin.firestore.FieldValue.serverTimestamp(),
        point: 0,
        pendingReward: 0,
        startRewardCountingTime: admin.firestore.FieldValue.serverTimestamp(),
        startXTokenCountingTime: admin.firestore.FieldValue.serverTimestamp(),
        active: false,
        isWhitelisted,
        whitelistAmountMinted: 0,
        avatarURL: userData.avatarURL ?? '',
        avatarURL_small: userData.avatarURL_small ?? '',
        username: userData.username ?? '',
        address: userData.address ?? '',
        lastTimeSwapXToken: admin.firestore.FieldValue.serverTimestamp(),
      }),
      firestore.collection('warDeployment').add({
        userId,
        seasonId: season.id,
        numberOfMachinesToEarn: 0,
        numberOfMachinesToAttack: 0,
        numberOfMachinesToDefend: 0,
        attackUserId: null,
      }),
      //TODO: Remove for testing
      firestore.collection('user').doc(userId).update({
        xTokenBalance: 10000,
      }),
    ]);
  }
};

export const createUserIfNotExist = async (userId) => {
  // console.log({ function: 'createUserIfNotExist', userId });
  const snapshot = await firestore.collection('user').doc(userId).get();
  const user = await privy.getUser(userId);

  const { wallet, twitter } = user;
  let isWhitelisted = false;
  if (!snapshot.exists) {
    const whitelistSnapshot = await firestore.collection('whitelisted').get();
    const whitelistedUsernames = whitelistSnapshot.docs
      .filter((doc) => !!doc.data().username)
      .map((doc) => doc.data().username.toLowerCase());
    isWhitelisted = Boolean(twitter?.username && whitelistedUsernames.includes(twitter.username.toLowerCase()));
    // create user
    const username = twitter ? twitter.username : faker.internet.userName();

    const defaultAvatar = `https://placehold.co/400x400/1e90ff/FFF?text=${username[0].toUpperCase()}`;
    let avatarURL_small = defaultAvatar;
    let avatarURL_big = defaultAvatar;
    if (twitter?.profilePictureUrl) {
      avatarURL_small = twitter.profilePictureUrl;
      avatarURL_big = twitter.profilePictureUrl.replace('_normal', '_bigger');
    }

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
    let tokenBalance = 0;
    let address = wallet?.address?.toLocaleLowerCase() || '';
    try {
      const tba = await getTokenBalance({ address });
      tokenBalance = Number(formatEther(tba));
    } catch (ex) {
      console.log(ex);
    }

    await firestore
      .collection('user')
      .doc(userId)
      .set({
        address: address,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        username,
        avatarURL: avatarURL_big,
        avatarURL_small,
        avatarURL_big,
        tokenBalance: tokenBalance,
        xTokenBalance: 0,
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
    const { username, ETHBalance, avatarURL_small } = snapshot.data();
    isWhitelisted = snapshot.data()?.isWhitelisted ?? false;
    // check if user has twitter avatar now
    if (twitter?.profilePictureUrl && avatarURL_small !== twitter.profilePictureUrl) {
      firestore
        .collection('user')
        .doc(userId)
        .update({
          avatarURL_small: twitter.profilePictureUrl,
          avatarURL_big: twitter.profilePictureUrl.replace('_normal', '_bigger'),
          avatarURL: twitter.profilePictureUrl.replace('_normal', '_bigger'),
        });
    }
    if (twitter?.username && username !== twitter.username) {
      firestore.collection('user').doc(userId).update({
        username: twitter.username,
      });
    }

    if (wallet) {
      updateETHBalance(userId, wallet, ETHBalance).catch((err) => console.error(err));
    }
  }

  await createGamePlayIfNotExist(userId, isWhitelisted);
};

const updateETHBalance = async (userId, wallet, ETHBalance) => {
  try {
    const value = await quickNode.getBalance(wallet.address, 'latest');

    if (ETHBalance !== Number(formatEther(value))) {
      await firestore
        .collection('user')
        .doc(userId)
        .update({
          address: wallet?.address?.toLocaleLowerCase() || '',
          ETHBalance: Number(formatEther(value)),
        });
    }
  } catch (err) {
    console.error(err);
  }
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
  const value = await quickNode.getBalance(address, 'latest');

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
export const getUserRankAndRewardV2 = async (userId) => {
  const rank = await getRank(userId);
  return rank;
};

export const updateLastOnlineTime = async (userId) => {
  try {
    await firestore
      .collection('user')
      .doc(userId)
      .update({ lastOnlineTime: admin.firestore.FieldValue.serverTimestamp() });
  } catch (err) {
    console.log({ err });
    console.error(err);
  }
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

export const getUserAvatarsSmall = async (userIds) => {
  const chunkIdsArrays = chunk(userIds, 10);

  const promises = chunkIdsArrays.map((ids) =>
    firestore.collection('user').where(admin.firestore.FieldPath.documentId(), 'in', ids).get()
  );
  const snapshots = await Promise.all(promises);

  const avatars = {};
  snapshots.map((snapshot) => snapshot.docs.map((doc) => (avatars[doc.id] = doc.data().avatarURL_small)));

  return avatars;
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
