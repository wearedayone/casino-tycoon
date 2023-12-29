import moment from 'moment';
import fs from 'fs';

import admin, { firestore } from '../configs/firebase.config.js';
import logger from '../utils/logger.js';
import { getActiveSeasonId, getActiveSeason } from './season.service.js';
import { calculateGeneratedReward, initTransaction, validateNonWeb3Transaction } from './transaction.service.js';
import { claimToken as claimTokenTask, burnNFT as burnNFTTask, burnGoon as burnGoonTask } from './worker.service.js';

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

  const warResultSnapshot = await firestore
    .collection('warSnapshot')
    .doc(latestWar.id)
    .collection('warResult')
    .where('userId', '==', userId)
    .limit(1)
    .get();
  if (!warResultSnapshot.empty) {
    const { isWarEnabled } = warResultSnapshot.docs[0].data();
    result.war = isWarEnabled;
  }

  return result;
};

export const takeDailyWarSnapshot = async () => {
  try {
    logger.info('\n\n---------taking daily war snapshot--------\n');
    const activeSeason = await getActiveSeason();
    const { id: seasonId, warConfig } = activeSeason || {};
    const usersGamePlaySnapshot = await firestore
      .collection('gamePlay')
      .where('active', '==', true)
      .where('seasonId', '==', seasonId)
      .get();

    const allUsers = usersGamePlaySnapshot.docs.map((gamePlay) => ({ id: gamePlay.id, ...gamePlay.data() }));
    const usersWithWarEnabled = allUsers.filter(({ war }) => !!war);
    const usersWithWarEnabledCount = usersWithWarEnabled.length;

    const voteRatio = usersWithWarEnabledCount / usersGamePlaySnapshot.size;
    const isPenalty = Math.round(voteRatio * 100) / 100 >= BONUS_LIMIT;

    const bonusMap = {};
    const penaltyMap = {};
    const createdAt = admin.firestore.FieldValue.serverTimestamp();

    logger.info(
      `${usersWithWarEnabledCount} players voted WAR out of ${usersGamePlaySnapshot.size} players\n voteRatio = ${voteRatio}. isPenalty = ${isPenalty}`
    );

    // calculate bonus & penalty
    for (let gamePlay of usersWithWarEnabled) {
      logger.info(`${gamePlay.userId}`);

      if (isPenalty) {
        const gangster = getDeadCount(gamePlay.numberOfMachines, warConfig?.dieChance);
        const goon = getDeadCount(gamePlay.numberOfWorkers, warConfig?.dieChance);
        penaltyMap[gamePlay.userId] = { gangster, goon };

        logger.info(`   penalty.gangster: ${gangster}`);
        logger.info(`   penalty.goon: ${goon}`);
      } else {
        const userDailyIncome = await getUserDailyIncome(gamePlay.userId);
        bonusMap[gamePlay.userId] = userDailyIncome * warConfig?.warBonus;
      }
    }

    // log war snapshot
    const todayDateString = moment().format('YYYYMMDD-HHmmss');
    await firestore.collection('warSnapshot').doc(todayDateString).set({
      seasonId,
      usersCount: usersGamePlaySnapshot.size,
      usersWithWarEnabledCount,
      voteRatio,
      createdAt,
      bonus: bonusMap,
      penalty: penaltyMap,
    });

    // log user war result
    const gangsterPenalties = [];
    const goonPenalties = [];
    const penaltyUsers = [];

    for (let gamePlay of allUsers) {
      const bonus = bonusMap[gamePlay.userId] ?? null;
      const penalty = penaltyMap[gamePlay.userId] ?? null;
      try {
        await firestore.collection('warSnapshot').doc(todayDateString).collection('warResult').add({
          seasonId,
          isWarEnabled: !!gamePlay.war,
          voteRatio,
          bonus,
          penalty,
          createdAt,
          userId: gamePlay.userId,
          numberOfMachines: gamePlay.numberOfMachines,
          numberOfWorkers: gamePlay.numberOfWorkers,
        });

        // send user war bonus
        if (bonus) {
          const txn = await initTransaction({
            userId: gamePlay.userId,
            type: 'war-bonus',
            value: bonus,
          });

          const userSnapshot = await firestore.collection('user').doc(gamePlay.userId).get();
          const { address } = userSnapshot.data();
          const { txnHash, status } = await claimTokenTask({
            address,
            amount: BigInt(bonus * 1e6) * BigInt(1e12),
          });

          await firestore.collection('transaction').doc(txn.id).update({
            txnHash,
            status,
          });
        }

        // burn user assets as penalty
        if (penalty?.gangster || penalty?.goon) {
          const txn = await initTransaction({
            userId: gamePlay.userId,
            type: 'war-penalty',
            machinesDeadCount: penalty.gangster,
            workersDeadCount: penalty.goon,
          });

          // need onchain action
          if (penalty.gangster) {
            const userSnapshot = await firestore.collection('user').doc(gamePlay.userId).get();
            const { address } = userSnapshot.data();

            gangsterPenalties.push({
              txnId: txn.id,
              address,
              amount: penalty.gangster,
            });
          }

          if (penalty.goon) {
            const userSnapshot = await firestore.collection('user').doc(gamePlay.userId).get();
            const { address } = userSnapshot.data();

            goonPenalties.push({
              address,
              amount: penalty.goon,
            });
          }

          penaltyUsers.push({ userId: gamePlay.userId, txnId: txn.id });
        }
      } catch (error) {
        console.error(error);
        logger.error(`err while writing war result for ${gamePlay.userId}: ${error.message}`);
      }
    }

    // console.log(`Penalty`, { gangsterPenalties, goonPenalties, penaltyUsers });
    logger.info(`Penalty: ${JSON.stringify({ gangsterPenalties, goonPenalties, penaltyUsers })}`);

    let gangsterPenaltyTxnStatus = 'Success';
    if (gangsterPenalties.length) {
      const addresses = gangsterPenalties.map((item) => item.address);
      const ids = Array(gangsterPenalties.length).fill(1);
      const amounts = gangsterPenalties.map((item) => item.amount);
      const { txnHash, status } = await burnNFTTask({ addresses, ids, amounts });
      gangsterPenaltyTxnStatus = status;
      // console.log(`Gangster penalties, ${JSON.stringify({ addresses, ids, amounts, txnHash, status })}`);
      logger.info(`Gangster penalties, ${JSON.stringify({ addresses, ids, amounts, txnHash, status })}`);

      const updateTxnPromises = gangsterPenalties.map((item) => {
        return firestore.collection('transaction').doc(item.txnId).update({
          txnHash,
          status,
        });
      });

      await Promise.all(updateTxnPromises);
    }

    let goonPenaltyTxnStatus = 'Success';
    if (goonPenalties.length) {
      const addresses = goonPenalties.map((item) => item.address);
      const amounts = goonPenalties.map((item) => item.amount);
      const { txnHash, status } = await burnGoonTask({ addresses, amounts });
      goonPenaltyTxnStatus = status;
      // console.log(`Goon penalties, ${JSON.stringify({ addresses, amounts, txnHash, status })}`);
      logger.info(`Goon penalties, ${JSON.stringify({ addresses, amounts, txnHash, status })}`);
    }

    // console.log({ gangsterPenaltyTxnStatus, goonPenaltyTxnStatus, penaltyUsers });
    if (gangsterPenaltyTxnStatus === 'Success' && goonPenaltyTxnStatus === 'Success' && penaltyUsers.length) {
      const updateUserGamePlayPromises = penaltyUsers.map((item) =>
        validateNonWeb3Transaction({ userId: item.userId, transactionId: item.txnId })
      );
      await Promise.all(updateUserGamePlayPromises);
    }

    logger.info('\n---------finish taking daily war snapshot--------\n\n');
  } catch (ex) {
    logger.error(ex);
  }
};

export const getWarHistory = async (userId) => {
  const seasonId = await getActiveSeasonId();

  const warHistorySnapshot = await firestore
    .collectionGroup('warResult')
    .where('seasonId', '==', seasonId)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  const warHistory = warHistorySnapshot.docs.map((doc, index) => {
    const { createdAt, ...rest } = doc.data();
    return { id: `${index}-${doc.id}`, createdAt: createdAt.toDate(), ...rest };
  });
  return warHistory;
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
    const { id: seasonId, warConfig } = activeSeason;

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
      usersCount: gamePlays.length,
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

    const bonusUsers = [];
    const penaltyUsers = [];
    for (const user of Object.values(users)) {
      const { userId, attackUserId, attackUnits } = user;

      if (attackUserId) {
        const attackedUser = users[attackUserId];

        if (attackUnits > attackedUser.defendUnits) {
          const winningAttackers = attackers[attackedUser.userId].filter(
            (user) => user.attackUnits > attackedUser.defendUnits
          );
          const totalAttackUnits = winningAttackers.reduce((total, item) => total + item.attackUnits, 0);
          const winningRatio = attackUnits / totalAttackUnits;

          const stolenToken = Math.floor(winningRatio * earningStealPercent * attackedUser.tokenEarnFromEarning);
          user.tokenEarnFromAttacking = stolenToken;
          user.totalTokenReward += stolenToken;
          user.attackResults.push({ userId: attackedUser.userId, result: 'win' });

          attackedUser.tokenStolen += stolenToken;
          attackedUser.totalTokenReward -= stolenToken;
          attackedUser.defendResults.push({ userId, result: 'lose' });
        }

        if (attackUnits < attackedUser.defendUnits) {
          const machinesLost = Math.max(Math.floor(attackUnits * machinePercentLost), 1);
          user.machinesLost = machinesLost;
          user.attackResults.push({ userId: attackedUser.userId, result: 'lose' });

          attackedUser.defendResults.push({ userId, result: 'win' });
        }

        if (attackUnits === attackedUser.defendUnits) {
          user.attackResults.push({ userId: attackedUser.userId, result: 'draw' });

          attackedUser.defendResults.push({ userId, result: 'draw' });
        }
      }
    }

    // fs.writeFileSync('./test.json', JSON.stringify(users), { encoding: 'utf-8' });
    logger.info(`Users war snapshot, ${JSON.stringify(users)}`);

    const promises = Object.values(users).map((data) =>
      firestore
        .collection('warSnapshot')
        .doc(todayDateString)
        .collection('warResult')
        .doc(data.userId)
        .set({ ...data })
    );
    await Promise.all(promises);

    logger.info('\n---------finish taking daily war snapshot--------\n\n');
  } catch (err) {
    console.error(err);
    logger.error(err.message);
  }
};
