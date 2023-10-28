import admin, { firestore } from '../configs/firebase.config.js';
import { getActiveSeasonId } from './season.service.js';
import { calculatePendingReward } from './transaction.service.js';

const BONUS_CHANCE = 0.5;
const BONUS_MULTIPLIER = 1;
const PENALTY_CHANCE = 0.1;

export const takeDailyWarSnapshot = async () => {
  console.log('\n\n---------taking daily war snapshot--------\n');
  const seasonId = await getActiveSeasonId();
  const usersGamePlaySnapshot = await firestore.collection('gamePlay').where('seasonId', '==', seasonId).get();
  const allUsers = usersGamePlaySnapshot.docs.map((gamePlay) => ({ id: gamePlay.id, ...gamePlay.data() }));
  const usersWithWarEnabled = allUsers.filter(({ war }) => !!war);
  const usersWithWarEnabledCount = usersWithWarEnabled.length;

  const voteRatio = usersWithWarEnabledCount / usersGamePlaySnapshot.size;
  const isPenalty = Math.round(voteRatio * 100) / 100 >= BONUS_CHANCE;

  const promises = [],
    bonusMap = {},
    pendingRewardMap = {}, // update when calc bonus
    penaltyMap = {},
    createdAt = admin.firestore.FieldValue.serverTimestamp();

  console.log(
    `${usersWithWarEnabledCount} players voted WAR out of ${usersGamePlaySnapshot.size} players\n voteRatio = ${voteRatio}`
  );

  // reset pending rewards timestamp
  for (let gamePlay of allUsers) {
    pendingRewardMap[gamePlay.userId] = await calculatePendingReward(gamePlay.userId);
  }

  // calculate bonus & penalty
  for (let gamePlay of usersWithWarEnabled) {
    if (isPenalty) {
      penaltyMap[gamePlay.userId] = {
        gangster: Math.round(PENALTY_CHANCE * gamePlay.numberOfMachines),
        goon: Math.round(PENALTY_CHANCE * gamePlay.numberOfWorkers),
      };
    } else {
      bonusMap[gamePlay.userId] =
        (gamePlay.pendingRewardSinceLastWar + pendingRewardMap[gamePlay.userId]) * BONUS_MULTIPLIER;
    }
  }

  if (isPenalty) console.log('\npenaltyMap: ', penaltyMap);
  else console.log('\nbonusMap: ', bonusMap);

  // log war snapshot
  await firestore.collection('warSnapshot').add({
    seasonId,
    usersCount: usersGamePlaySnapshot.size,
    usersWithWarEnabledCount,
    voteRatio,
    createdAt,
    bonus: bonusMap,
    penalty: penaltyMap,
  });

  // log user war history
  allUsers.forEach((gamePlay) => {
    const bonus = bonusMap[gamePlay.userId] ?? null;
    const penalty = penaltyMap[gamePlay.userId] ?? null;
    promises.push(
      firestore.collection('user').doc(gamePlay.userId).collection('warHistory').add({
        isWarEnabled: !!gamePlay.war,
        voteRatio,
        createdAt,
        bonus,
        penalty,
      })
    );
    const pendingRewardWithoutBonus = gamePlay.pendingReward + pendingRewardMap[gamePlay.userId];
    const pendingReward = bonus ? pendingRewardWithoutBonus + bonus : pendingRewardWithoutBonus;

    promises.push(
      firestore.collection('gamePlay').doc(gamePlay.id).update({
        pendingReward,
        pendingRewardSinceLastWar: 0, // reset
        startRewardCountingTime: createdAt,
      })
    );

    if (penalty?.gangster || penalty?.goon) {
      promises.push(
        firestore
          .collection('gamePlay')
          .doc(gamePlay.id)
          .update({
            numberOfMachines: gamePlay.numberOfMachines - penalty?.gangster,
            numberOfWorkers: gamePlay.numberOfWorkers - penalty?.goon,
          })
      );
    }
  });

  await Promise.all(promises);

  console.log('\n---------finish taking daily war snapshot--------\n\n');
};
