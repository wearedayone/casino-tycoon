import moment from 'moment';
import fs from 'fs';

import admin, { firestore } from '../configs/firebase.config.js';
import logger from '../utils/logger.js';
import { getActiveSeasonId, getActiveSeason } from './season.service.js';
import { calculateGeneratedReward, initTransaction, validateNonWeb3Transaction } from './transaction.service.js';
import { claimTokenBatch, burnNFT as burnNFTTask, burnGoon as burnGoonTask } from './worker.service.js';
import { getUserUsernames } from './user.service.js';
import { parseEther } from '@ethersproject/units';
import { getUserGamePlay } from './gamePlay.service.js';

const BONUS_LIMIT = 0.5;

export const getLatestWar = async (userId) => {
  const snapshot = await firestore.collection('warSnapshot').orderBy('createdAt', 'desc').limit(1).get();
  if (snapshot.empty) return null;

  const latestWar = {
    id: snapshot.docs[0].id,
    ...snapshot.docs[0].data(),
    createdAt: snapshot.docs[0].data().createdAt.toDate().getTime(),
  };

  const result = { latestWar };

  return result;
};

export const getWarHistory = async (userId) => {
  const seasonId = await getActiveSeasonId();

  const warHistorySnapshot = await firestore
    .collectionGroup('warResult')
    .where('seasonId', '==', seasonId)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  const warHistory = warHistorySnapshot.docs.map((doc) => {
    const { createdAt, totalTokenReward, machinesLost } = doc.data();
    return {
      id: doc.id,
      warSnapshotId: doc.ref.parent.parent.id,
      date: moment(createdAt.toDate()).format('DD/MM'),
      totalTokenReward,
      machinesLost,
    };
  });
  return warHistory;
};

export const getWarHistoryDetail = async ({ userId, warSnapshotId, warResultId }) => {
  const snapshot = await firestore
    .collection('warSnapshot')
    .doc(warSnapshotId)
    .collection('warResult')
    .doc(warResultId)
    .get();
  if (!snapshot.exists) return null;

  const { attackResults, defendResults } = snapshot.data();
  const userIds = [...new Set([...(attackResults || []), ...(defendResults || [])].map((item) => item.userId))];
  const usernames = await getUserUsernames(userIds);

  return {
    id: snapshot.id,
    ...snapshot.data(),
    attackResults: (attackResults || []).map((item) => ({
      ...item,
      userUsername: usernames[item.userId],
    })),
    defendResults: (defendResults || []).map((item) => ({
      ...item,
      userUsername: usernames[item.userId],
    })),
  };
};

export const getWarHistoryLatest = async ({ userId }) => {
  const seasonId = await getActiveSeasonId();

  const warHistorySnapshot = await firestore
    .collectionGroup('warResult')
    .where('seasonId', '==', seasonId)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (warHistorySnapshot.empty) return null;

  const snapshot = warHistorySnapshot.docs[0];

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
};

// utils
const getDeadCount = (originalCount, dieChance) => {
  // example: originalCount = 86, dieChance = 0.1;
  // deadCount = 8.6;
  const deadCount = originalCount * dieChance;
  // certainDeathCount = 8 => 8 units certainly will die
  const certainDeathCount = Math.floor(deadCount);

  // chanceOfExtraDeath = 0.6 => 1 unit has 60% of dying
  const chanceOfExtraDeath = deadCount - certainDeathCount;
  const extraDeath = Math.random() < chanceOfExtraDeath ? 1 : 0;
  logger.info(`originalCount: ${originalCount}`);
  logger.info(`deadCount: ${certainDeathCount + extraDeath}`);

  return certainDeathCount + extraDeath;
};

const getUserDailyIncome = async (userId) => {
  const activeSeason = await getActiveSeason();
  const { machine, worker } = activeSeason || {};
  if (!machine || !worker) return 0;

  const userGamePlaySnapshot = await firestore
    .collection('gamePlay')
    .where('userId', '==', userId)
    .where('seasonId', '==', activeSeason.id)
    .get();
  if (userGamePlaySnapshot.empty) return 0;

  const userGamePlay = { id: userGamePlaySnapshot.docs[0].id, ...userGamePlaySnapshot.docs[0].data() };
  const { numberOfMachines, numberOfWorkers } = userGamePlay;

  return machine.dailyReward * numberOfMachines + worker.dailyReward * numberOfWorkers;
};

export const generateDailyWarSnapshot = async () => {
  try {
    logger.info('\n\n---------taking daily war snapshot--------\n');

    const activeSeason = await getActiveSeason();
    const { id: seasonId, warConfig, status } = activeSeason;
    if (status !== 'open') {
      logger.info('\n\n---------no active season--------\n');
      return;
    }

    const gamePlaySnapshot = await firestore
      .collection('gamePlay')
      .where('active', '==', true)
      .where('seasonId', '==', seasonId)
      .get();

    const attackers = {};
    const gamePlays = gamePlaySnapshot.docs.map((doc) => {
      const attackUserId = doc.data().warDeployment.attackUserId;
      if (attackUserId) {
        attackers[attackUserId] = [
          ...(attackers[attackUserId] || []),
          { userId: doc.data().userId, attackUnits: doc.data().warDeployment.numberOfMachinesToAttack },
        ];
      }

      return { id: doc.id, ...doc.data() };
    });

    // create warSnapshot
    const todayDateString = moment().format('YYYYMMDD-HHmmss');
    await firestore.collection('warSnapshot').doc(todayDateString).set({
      seasonId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const {
      buildingBonusMultiple,
      workerBonusMultiple,
      earningStealPercent,
      tokenRewardPerEarner,
      machinePercentLost,
    } = warConfig;

    const users = gamePlays.reduce((result, gamePlay) => {
      const earnUnits = workerBonusMultiple * gamePlay.numberOfWorkers + gamePlay.warDeployment.numberOfMachinesToEarn;

      console.log(gamePlay.userId);
      if (!gamePlay.userId.startsWith('did:privy:')) return result;

      return {
        ...result,
        [gamePlay.userId]: {
          seasonId,
          userId: gamePlay.userId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          numberOfMachines: gamePlay.numberOfMachines,
          numberOfWorkers: gamePlay.numberOfWorkers,
          numberOfBuildings: gamePlay.numberOfBuildings,
          numberOfMachinesToEarn: gamePlay.warDeployment.numberOfMachinesToEarn,
          numberOfMachinesToAttack: gamePlay.warDeployment.numberOfMachinesToAttack,
          numberOfMachinesToDefend: gamePlay.warDeployment.numberOfMachinesToDefend,
          earnUnits,
          attackUnits: gamePlay.warDeployment.numberOfMachinesToAttack,
          defendUnits:
            buildingBonusMultiple * gamePlay.numberOfBuildings + gamePlay.warDeployment.numberOfMachinesToDefend,
          attackUserId: gamePlay.warDeployment.attackUserId,
          tokenEarnFromEarning: tokenRewardPerEarner * earnUnits,
          tokenEarnFromAttacking: 0, // havent been calculated at this time
          tokenStolen: 0, // havent been calculated at this time
          totalTokenReward: tokenRewardPerEarner * earnUnits, // havent been fully calculated at this time
          machinesLost: 0, // havent been calculated at this time
          attackResults: [], // havent been calculated at this time
          defendResults: [], // havent been calculated at this time
        },
      };
    }, {});

    for (const user of Object.values(users)) {
      const { userId, attackUserId, attackUnits } = user;

      if (!attackUserId || !users[attackUserId]) continue;

      const attackedUser = users[attackUserId];

      const totalAttackUnits = attackers[attackedUser.userId].reduce((total, item) => total + item.attackUnits, 0);
      const attackContribution = !!totalAttackUnits ? Number((attackUnits / totalAttackUnits).toFixed(2)) : 0;

      if (attackUnits > attackedUser.defendUnits) {
        const winningAttackers = attackers[attackedUser.userId].filter(
          (user) => user.attackUnits > attackedUser.defendUnits
        );
        const totalAttackUnits = winningAttackers.reduce((total, item) => total + item.attackUnits, 0);
        const winningRatio = attackUnits / totalAttackUnits;

        const stolenToken = Math.floor(winningRatio * earningStealPercent * attackedUser.tokenEarnFromEarning);
        user.tokenEarnFromAttacking = stolenToken;
        user.totalTokenReward += stolenToken;
        user.attackResults.push({
          userId: attackedUser.userId,
          result: 'win',
          attackUnits,
          defendUnits: attackedUser.defendUnits,
          winningRatio,
          attackContribution,
        });

        attackedUser.tokenStolen += stolenToken;
        attackedUser.totalTokenReward -= stolenToken;
        attackedUser.defendResults.push({
          userId,
          result: 'lose',
          attackUnits,
          defendUnits: attackedUser.defendUnits,
          machinesLost: 0,
        });
      }

      if (attackUnits < attackedUser.defendUnits) {
        const machinesLost = attackUnits > 0 ? Math.max(Math.floor(attackUnits * machinePercentLost), 1) : 0;
        user.machinesLost = machinesLost;
        user.attackResults.push({
          userId: attackedUser.userId,
          result: 'lose',
          attackUnits,
          defendUnits: attackedUser.defendUnits,
          winningRatio: 0,
          attackContribution,
        });

        attackedUser.defendResults.push({
          userId,
          result: 'win',
          attackUnits,
          defendUnits: attackedUser.defendUnits,
          machinesLost,
        });
      }

      if (attackUnits === attackedUser.defendUnits) {
        user.attackResults.push({
          userId: attackedUser.userId,
          result: 'draw',
          attackUnits,
          defendUnits: attackedUser.defendUnits,
          winningRatio: 0,
          attackContribution,
        });

        attackedUser.defendResults.push({
          userId,
          result: 'draw',
          attackUnits,
          defendUnits: attackedUser.defendUnits,
          machinesLost: 0,
        });
      }
    }

    // logger.info(`Users war snapshot, ${JSON.stringify(users)}`);

    const promises = Object.values(users).map((data) =>
      firestore
        .collection('warSnapshot')
        .doc(todayDateString)
        .collection('warResult')
        .doc(data.userId)
        .set({ ...data })
    );
    await Promise.all(promises);

    // send rewards and burn NFT
    const bonusUsers = Object.values(users).map((item) => ({ userId: item.userId, amount: item.totalTokenReward }));
    const penaltyUsers = Object.values(users)
      .filter((item) => !!item.machinesLost)
      .map((item) => ({ userId: item.userId, amount: item.machinesLost }));

    // fs.writeFileSync('../test.json', JSON.stringify({ users, bonusUsers, penaltyUsers }), { encoding: 'utf-8' });

    await burnMachinesLost(penaltyUsers);
    await claimWarReward(bonusUsers);

    logger.info('\n---------finish taking daily war snapshot--------\n\n');
  } catch (err) {
    console.error(err);
    logger.error(err.message);
  }
};

export const claimWarReward = async (bonusUsers) => {
  if (!bonusUsers.length) return;

  const userIds = bonusUsers.map((item) => item.userId);
  const userPromises = userIds.map((id) => firestore.collection('user').doc(id).get());
  const userSnapshots = await Promise.all(userPromises);
  const users = [];
  for (const index in userSnapshots) {
    const snapshot = userSnapshots[index];
    if (!snapshot.exists) continue;

    const txn = await initTransaction({
      userId: snapshot.id,
      type: 'war-bonus',
      value: bonusUsers[index].amount,
    });

    users.push({
      userId: snapshot.id,
      txnId: txn.id,
      address: snapshot.data().address,
      amount: bonusUsers[index].amount,
    });
  }

  const addresses = users.map((item) => item.address);
  const amounts = users.map((item) => parseEther(`${item.amount}`));
  const { txnHash, status } = await claimTokenBatch({ addresses, amounts });

  logger.info(`War bonus, ${JSON.stringify({ addresses, amounts, txnHash, status })}`);

  const updateTxnPromises = users.map((item) => {
    return firestore.collection('transaction').doc(item.txnId).update({
      txnHash,
      status,
    });
  });

  await Promise.all(updateTxnPromises);

  if (status === 'Success') {
    const updateUserGamePlayPromises = users.map((item) =>
      validateNonWeb3Transaction({ userId: item.userId, transactionId: item.txnId })
    );
    await Promise.all(updateUserGamePlayPromises);
  }
};

export const burnMachinesLost = async (penaltyUsers) => {
  if (!penaltyUsers.length) return;

  const userIds = penaltyUsers.map((item) => item.userId);
  const userPromises = userIds.map((id) => firestore.collection('user').doc(id).get());
  const userSnapshots = await Promise.all(userPromises);
  const users = [];
  for (const index in userSnapshots) {
    const snapshot = userSnapshots[index];
    if (!snapshot.exists) continue;

    const txn = await initTransaction({
      userId: snapshot.id,
      type: 'war-penalty',
      machinesDeadCount: penaltyUsers[index].amount,
    });

    users.push({
      userId: snapshot.id,
      txnId: txn.id,
      address: snapshot.data().address,
      amount: penaltyUsers[index].amount,
    });
  }

  const addresses = users.map((item) => item.address);
  const ids = Array(users.length).fill(1);
  const amounts = users.map((item) => item.amount);
  const { txnHash, status } = await burnNFTTask({ addresses, ids, amounts });

  logger.info(`Gangster penalties, ${JSON.stringify({ addresses, ids, amounts, txnHash, status })}`);

  const updateTxnPromises = users.map((item) => {
    return firestore.collection('transaction').doc(item.txnId).update({
      txnHash,
      status,
    });
  });

  await Promise.all(updateTxnPromises);

  if (status === 'Success') {
    const updateUserGamePlayPromises = users.map((item) =>
      validateNonWeb3Transaction({ userId: item.userId, transactionId: item.txnId })
    );
    await Promise.all(updateUserGamePlayPromises);
  }
};

export const getUsersToAttack = async ({ page, limit, search }) => {
  const activeSeasonId = await getActiveSeasonId();

  const gamePlaySnapshot = await firestore
    .collection('gamePlay')
    .where('seasonId', '==', activeSeasonId)
    .orderBy('networth', 'desc')
    .orderBy('createdAt', 'asc')
    .get();

  let filteredGamePlaySnapshotDocs = gamePlaySnapshot.docs;
  const ranks = filteredGamePlaySnapshotDocs.reduce((result, doc, index) => {
    result[doc.data().userId] = index + 1;
    return result;
  }, {});

  const searchString = (search || '').toLowerCase().trim();
  if (searchString) {
    const userSnapshot = await firestore.collection('user').get();
    const userIds = userSnapshot.docs
      .filter((doc) => doc.data().username.toLowerCase().includes(searchString))
      .map((doc) => doc.id);
    filteredGamePlaySnapshotDocs = filteredGamePlaySnapshotDocs.filter((doc) => userIds.includes(doc.data().userId));
  }
  const totalDocs = filteredGamePlaySnapshotDocs.length;

  const start = page * limit;
  const end = (page + 1) * limit;
  filteredGamePlaySnapshotDocs = filteredGamePlaySnapshotDocs.slice(start, end);

  const userIds = filteredGamePlaySnapshotDocs.map((item) => item.data().userId);
  const usernames = await getUserUsernames(userIds);

  const lastWarSnapshotSnapshot = await firestore.collection('warSnapshot').orderBy('createdAt', 'desc').limit(1).get();
  if (lastWarSnapshotSnapshot.empty) {
    const users = filteredGamePlaySnapshotDocs.map((doc, index) => ({
      id: doc.data().userId,
      rank: index + 1,
      username: usernames[doc.data().userId],
      lastDayTokenReward: 0,
      active: doc.data().active,
    }));

    return { totalDocs, docs: users };
  }

  const lastWarResultSnasphot = await firestore
    .collection('warSnapshot')
    .doc(lastWarSnapshotSnapshot.docs[0].id)
    .collection('warResult')
    .get();
  const totalTokenRewards = lastWarResultSnasphot.docs.reduce(
    (result, item) => ({ ...result, [item.data().userId]: item.data().totalTokenReward }),
    {}
  );

  const users = filteredGamePlaySnapshotDocs.map((doc, index) => ({
    id: doc.data().userId,
    rank: ranks[doc.data().userId],
    username: usernames[doc.data().userId],
    lastDayTokenReward: totalTokenRewards[doc.data().userId] || 0,
    active: doc.data().active,
  }));

  return { totalDocs, docs: users };
};

export const getUserToAttackDetail = async (userId) => {
  const userGamePlay = await getUserGamePlay(userId);
  if (!userGamePlay) throw new Error('Bad request: cannot find game play');

  const { numberOfMachines, numberOfWorkers, numberOfBuildings } = userGamePlay;

  const seasonId = await getActiveSeasonId();
  const warHistorySnapshot = await firestore
    .collectionGroup('warResult')
    .where('seasonId', '==', seasonId)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  const userIds = [userId];
  warHistorySnapshot.docs.map((doc) => {
    const attackUserIds = doc.data().attackResults?.map((item) => item.userId) || [];
    const defendUserIds = doc.data().defendResults?.map((item) => item.userId) || [];
    userIds.push(...[...attackUserIds, ...defendUserIds]);
  });

  const usernames = await getUserUsernames([...new Set(userIds)]);
  const warResults = warHistorySnapshot.docs.map((doc) => {
    const { createdAt, attackResults, defendResults } = doc.data();
    return {
      id: doc.id,
      warSnapshotId: doc.ref.parent.parent.id,
      date: moment(createdAt.toDate()).format('DD/MM'),
      ...doc.data(),
      attackResults: (attackResults || []).map((item) => ({ ...item, userUsername: usernames[item.userId] })),
      defendResults: (defendResults || []).map((item) => ({ ...item, userUsername: usernames[item.userId] })),
    };
  });

  return {
    user: { id: userId, username: usernames[userId] },
    gamePlay: { numberOfMachines, numberOfWorkers, numberOfBuildings },
    warResults,
  };
};
