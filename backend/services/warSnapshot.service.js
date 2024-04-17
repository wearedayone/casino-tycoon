// import fs from 'fs';
import moment from 'moment';
import { parseEther } from '@ethersproject/units';
import chunk from 'lodash.chunk';

import admin, { firestore } from '../configs/firebase.config.js';
import { getActiveSeasonId, getActiveSeason } from './season.service.js';
import { getNFTBalance, setWarResult } from './worker.service.js';
import { getUserUsernames } from './user.service.js';
import { getUserGamePlay } from './gamePlay.service.js';
import logger from '../utils/logger.js';
import { getAccurate } from '../utils/math.js';

const MAX_RETRY = 3;

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
    .limit(60)
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

export const generateDailyWarSnapshot = async () => {
  try {
    logger.info('\n\n---------taking daily war snapshot--------\n');

    const activeSeason = await getActiveSeason();
    const { id: seasonId, warConfig, status } = activeSeason;
    if (status !== 'open') {
      logger.info('\n\n---------no active season--------\n');
      return;
    }

    const warDeploymentSnapshot = await firestore.collection('warDeployment').where('seasonId', '==', seasonId).get();
    const allWarDeployments = warDeploymentSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const gamePlaySnapshot = await firestore
      .collection('gamePlay')
      .where('active', '==', true)
      .where('seasonId', '==', seasonId)
      .get();

    const attackers = {};
    const gamePlays = [];
    for (const doc of gamePlaySnapshot.docs) {
      const thisUserId = doc.data().userId;
      const warDeployment = allWarDeployments.find((item) => item.userId === thisUserId) ?? {};
      const attackUserId = warDeployment.attackUserId;
      if (attackUserId) {
        attackers[attackUserId] = [
          ...(attackers[attackUserId] || []),
          { userId: doc.data().userId, attackUnits: warDeployment.numberOfMachinesToAttack },
        ];
      }

      gamePlays.push({ id: doc.id, ...doc.data(), warDeployment });
    }

    const {
      buildingBonusMultiple,
      workerBonusMultiple,
      earningStealPercent,
      tokenRewardPerEarner,
      machinePercentLost,
    } = warConfig;

    const users = gamePlays.reduce((result, gamePlay) => {
      // console.log(gamePlay, gamePlay.userId, gamePlay.warDeployment);

      const earnUnits =
        getAccurate(workerBonusMultiple * gamePlay.numberOfWorkers) + gamePlay.warDeployment.numberOfMachinesToEarn;

      if (!gamePlay.userId.startsWith('did:privy:')) return result;

      return {
        ...result,
        [gamePlay.userId]: {
          seasonId,
          gamePlayId: gamePlay.id,
          warDeploymentId: gamePlay.warDeployment?.id,
          networth: gamePlay.networth,
          userId: gamePlay.userId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          startRewardCountingTime: gamePlay.startRewardCountingTime,
          pendingReward: gamePlay.pendingReward,
          dailyReward: gamePlay.machine.dailyReward * gamePlay.numberOfMachines,
          numberOfMachines: gamePlay.numberOfMachines,
          numberOfWorkers: gamePlay.numberOfWorkers,
          numberOfBuildings: gamePlay.numberOfBuildings,
          numberOfMachinesToEarn: gamePlay.warDeployment.numberOfMachinesToEarn,
          numberOfMachinesToAttack: gamePlay.warDeployment.numberOfMachinesToAttack,
          numberOfMachinesToDefend: gamePlay.warDeployment.numberOfMachinesToDefend,
          earnUnits,
          attackUnits: gamePlay.warDeployment.numberOfMachinesToAttack,
          defendUnits:
            getAccurate(buildingBonusMultiple * gamePlay.numberOfBuildings) +
            gamePlay.warDeployment.numberOfMachinesToDefend,
          attackUserId: gamePlay.warDeployment.attackUserId,
          tokenEarnFromEarning: tokenRewardPerEarner * earnUnits,
          tokenEarnFromAttacking: 0, // havent been calculated at this time
          gainedReputation: 0, // havent been calculated at this time
          tokenStolen: 0, // havent been calculated at this time
          totalTokenReward: tokenRewardPerEarner * earnUnits, // havent been fully calculated at this time
          machinesLost: 0, // havent been calculated at this time
          attackResults: [], // havent been calculated at this time
          defendResults: [], // havent been calculated at this time
        },
      };
    }, {});

    for (const user of Object.values(users)) {
      const { userId, attackUserId, attackUnits, networth } = user;

      if (!attackUserId || !users[attackUserId]) continue;

      const attackedUser = users[attackUserId];

      const totalAttackUnits = attackers[attackedUser.userId].reduce((total, item) => total + item.attackUnits, 0);
      const attackContribution = !!totalAttackUnits ? attackUnits / totalAttackUnits : 0;

      if (totalAttackUnits > attackedUser.defendUnits) {
        // winners gain reputation
        let gainedReputationPercent = 0;
        const reputationRatio = attackedUser.networth / networth;

        if (reputationRatio > 10) gainedReputationPercent = 0.005;
        else if (reputationRatio > 5) gainedReputationPercent = 0.004;
        else if (reputationRatio > 3) gainedReputationPercent = 0.003;
        else if (reputationRatio > 2) gainedReputationPercent = 0.002;
        else if (reputationRatio > 1) gainedReputationPercent = 0.001;
        user.gainedReputation = Math.round(attackedUser.networth * gainedReputationPercent);

        const stolenToken = Math.floor(attackContribution * earningStealPercent * attackedUser.tokenEarnFromEarning);
        user.tokenEarnFromAttacking = stolenToken;
        user.totalTokenReward += stolenToken;
        user.attackResults.push({
          userId: attackedUser.userId,
          result: 'win',
          attackUnits,
          defendUnits: attackedUser.defendUnits,
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

      if (totalAttackUnits < attackedUser.defendUnits) {
        const machinesLost = attackUnits > 0 ? getDeadCount(attackUnits, machinePercentLost) : 0;
        user.machinesLost = machinesLost;
        user.attackResults.push({
          userId: attackedUser.userId,
          result: 'lose',
          attackUnits,
          defendUnits: attackedUser.defendUnits,
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

      if (totalAttackUnits === attackedUser.defendUnits) {
        user.attackResults.push({
          userId: attackedUser.userId,
          result: 'draw',
          attackUnits,
          defendUnits: attackedUser.defendUnits,
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

    // need to create warSnapshot document, warResult documents
    const batch = firestore.batch();

    // create warSnapshot
    const todayDateString = moment().format('YYYYMMDD-HHmmss');
    const warSnapshotDocRef = firestore.collection('warSnapshot').doc(todayDateString);
    batch.set(warSnapshotDocRef, { seasonId, createdAt: admin.firestore.FieldValue.serverTimestamp() });

    // create warResult documents
    Object.values(users).map((data) => {
      const warResultRef = firestore
        .collection('warSnapshot')
        .doc(todayDateString)
        .collection('warResult')
        .doc(data.userId);

      batch.set(warResultRef, { ...data });
    });

    let retry = 0;
    let isSuccess = false;
    while (retry < MAX_RETRY && !isSuccess) {
      try {
        logger.info(`Create warSnapshot && war result in ${todayDateString}. Retry ${retry++} times`);
        await batch.commit();
        isSuccess = true;
      } catch (err) {
        logger.error(`Unsuccessful create warSnapshot && war result in ${todayDateString}: ${JSON.stringify(err)}`);
      }
    }

    if (isSuccess) {
      // submitWarResults
      const userWarResults = Object.values(users).map((item) => ({
        userId: item.userId,
        gamePlayId: item.gamePlayId,
        warDeploymentId: item.warDeploymentId,
        startRewardCountingTime: item.startRewardCountingTime,
        pendingReward: item.pendingReward,
        dailyReward: item.dailyReward,
        numberOfMachines: item.numberOfMachines,
        lostGangsters: item.machinesLost,
        lostGoons: 0,
        gainedTokens: item.totalTokenReward,
        gainedReputation: item.gainedReputation,
      }));

      // fs.writeFileSync('../test.json', JSON.stringify(userWarResults, null, 2), { encoding: 'utf-8' });

      // chunk to set war results
      const chunkedUsers = chunk(userWarResults, 50);
      const setWarResultsPromises = chunkedUsers.map((pUsers) => submitWarResults(pUsers));
      await Promise.all(setWarResultsPromises);
    }

    logger.info('\n---------finish taking daily war snapshot--------\n\n');
  } catch (err) {
    console.error(err);
    logger.error(err.message);
  }
};

const submitWarResults = async (users) => {
  if (!users.length) return;

  logger.info(`Start submit war result for users:\n ${JSON.stringify(users.map((user) => user.userId).join('\n'))}`);
  const batch = firestore.batch();

  const userIds = users.map((item) => item.userId);
  const userPromises = userIds.map((id) => firestore.collection('user').doc(id).get());
  const userSnapshots = await Promise.all(userPromises);
  const warResultsForContract = [];
  const warPenaltyTxns = [];
  const warBonusTxns = [];

  for (const index in userSnapshots) {
    const snapshot = userSnapshots[index];
    if (!snapshot.exists) continue;

    const {
      lostGangsters,
      lostGoons,
      gainedTokens,
      gainedReputation,
      gamePlayId,
      warDeploymentId,
      dailyReward,
      pendingReward,
      startRewardCountingTime,
      numberOfMachines,
    } = users[index];
    let burnedGangsters = lostGangsters;
    console.log({
      lostGangsters,
      lostGoons,
      gainedTokens,
      gainedReputation,
      gamePlayId,
      warDeploymentId,
      dailyReward,
      pendingReward,
      startRewardCountingTime,
    });

    if (lostGangsters || lostGoons) {
      const nft = await getNFTBalance({ address: snapshot.data().address });
      const nftBalance = nft.toNumber();
      console.log({ nftBalance });

      burnedGangsters = Math.min(lostGangsters, nftBalance);
      warPenaltyTxns.push({
        userId: snapshot.id,
        pendingReward,
        startRewardCountingTime,
        dailyReward,
        numberOfMachines,
        machinesDeadCount: burnedGangsters,
        workersDeadCount: lostGoons,
        gamePlayId,
        warDeploymentId,
      });
    }
    if (gainedTokens || gainedReputation) {
      warBonusTxns.push({ userId: snapshot.id, value: gainedTokens, gainedReputation, gamePlayId });
    }

    warResultsForContract.push({
      address: snapshot.data().address,
      lostGangsters,
      lostGoons,
      gainedTokens,
      gainedReputation,
    });
  }

  const addresses = warResultsForContract.map((item) => item.address);
  const lostGangsters = warResultsForContract.map((item) => item.lostGangsters);
  const lostGoons = warResultsForContract.map((item) => item.lostGoons);
  const wonReputations = warResultsForContract.map((item) => item.gainedReputation);
  const wonTokens = warResultsForContract.map((item) => parseEther(`${item.gainedTokens}`));
  const { txnHash, status } = await setWarResult({ addresses, lostGangsters, lostGoons, wonReputations, wonTokens });
  logger.info(
    `SetWarResult, ${JSON.stringify({
      addresses,
      lostGangsters,
      lostGoons,
      wonReputations,
      wonTokens,
      txnHash,
      status,
    })}`
  );

  // fs.writeFileSync(
  //   '../test1.json',
  //   JSON.stringify({ txn: { txnHash, status }, warPenaltyTxns, warBonusTxns }, null, 2),
  //   { encoding: 'utf-8' }
  // );

  const activeSeasonId = await getActiveSeasonId();

  warPenaltyTxns.map((item) => {
    const penaltyTxnRef = firestore.collection('transaction').doc();
    batch.create(penaltyTxnRef, {
      userId: item.userId,
      seasonId: activeSeasonId,
      type: 'war-penalty',
      machinesDeadCount: item.machinesDeadCount,
      workersDeadCount: item.workersDeadCount,
      status,
      txnHash,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (status === 'Success') {
      if (item.gamePlayId) {
        const gamePlayData = {
          numberOfMachines: admin.firestore.FieldValue.increment(-item.machinesDeadCount),
        };
        if (item.startRewardCountingTime && item.numberOfMachines) {
          const now = Date.now();
          const start = item.startRewardCountingTime.toDate().getTime();
          const diffInDays = (now - start) / (24 * 60 * 60 * 1000);

          const generatedReward = diffInDays * (item.numberOfMachines * item.dailyReward);
          const reward = Math.round(generatedReward * 1000) / 1000;
          const newReward = Number(item.pendingReward) + Number(reward);
          gamePlayData.pendingReward = newReward;
          gamePlayData.startRewardCountingTime = admin.firestore.FieldValue.serverTimestamp();
        }
        const gamePlayRef = firestore.collection('gamePlay').doc(item.gamePlayId);
        batch.update(gamePlayRef, gamePlayData);
      }

      if (item.warDeploymentId) {
        const warDeploymentRef = firestore.collection('warDeployment').doc(item.warDeploymentId);
        batch.update(warDeploymentRef, {
          numberOfMachinesToAttack: admin.firestore.FieldValue.increment(-item.machinesDeadCount),
        });
      }
    }
  });

  warBonusTxns.map((item) => {
    const bonusTxnRef = firestore.collection('transaction').doc();
    batch.create(bonusTxnRef, {
      userId: item.userId,
      seasonId: activeSeasonId,
      type: 'war-bonus',
      value: item.value,
      gainedReputation: item.gainedReputation,
      token: 'FIAT',
      status,
      txnHash,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (status === 'Success') {
      if (item.gamePlayId && item.gainedReputation) {
        const gamePlayRef = firestore.collection('gamePlay').doc(item.gamePlayId);
        batch.update(gamePlayRef, { networthFromWar: admin.firestore.FieldValue.increment(item.gainedReputation) });
      }
    }
  });

  let retry = 0;
  let isSuccess = false;
  while (retry < MAX_RETRY && !isSuccess) {
    try {
      logger.info(
        `Create submit war result for users:\n ${JSON.stringify(
          users.map((user) => user.userId).join('\n')
        )}. Retry ${retry++} times`
      );
      await batch.commit();
      isSuccess = true;
    } catch (err) {
      logger.error(
        `Unsuccessful submit war result for users:\n ${JSON.stringify(
          users.map((user) => user.userId).join('\n')
        )}: ${JSON.stringify(err)}`
      );
    }
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
  if (!userGamePlay) throw new Error('API error: Bad request - cannot find game play');

  const { numberOfMachines, numberOfWorkers, numberOfBuildings } = userGamePlay;

  const seasonId = await getActiveSeasonId();
  const warHistorySnapshot = await firestore
    .collectionGroup('warResult')
    .where('seasonId', '==', seasonId)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(60)
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
