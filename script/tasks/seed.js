import moment from 'moment';

import admin, { firestore } from '../configs/admin.config.js';
import environments from '../utils/environments.js';

const { TOKEN_ADDRESS, NFT_ADDRESS, GAME_CONTRACT_ADDRESS, ROUTER_ADDRESS, WETH_ADDRESS, PAIR_ADDRESS } = environments;

const warConfig = {
  buildingBonusMultiple: 1,
  workerBonusMultiple: 1,
  earningStealPercent: 0.5,
  tokenRewardPerEarner: 500,
  machinePercentLost: 0.1,
};
const assetsConfig = {
  machine: {
    basePrice: 0.001,
    whitelistPrice: 0.001,
    maxWhitelistAmount: 20,
    dailyReward: 1000,
    networth: 10,
    maxPerBatch: 100,
  },
  worker: {
    basePrice: 250,
    targetDailyPurchase: 100,
    targetPrice: 1000,
    dailyReward: 1000,
    networth: 2,
    maxPerBatch: 100,
  },
  building: {
    basePrice: 500,
    targetDailyPurchase: 100,
    targetPrice: 1000,
    dailyReward: 0,
    networth: 8,
    maxPerBatch: 100,
  },
};
const prizePoolConfig = {
  rankRewardsPercent: 0.7,
  reputationRewardsPercent: 0.2,
  rewardScalingRatio: 1.25,
  // rank leaderboard
  higherRanksCutoffPercent: 0.1,
  lowerRanksCutoffPercent: 0.5,
  minRewardHigherRanks: 0.004, // in ETH
  minRewardLowerRanks: 0.002, // in ETH
  // reputation leaderboard
  earlyRetirementTax: 0.2,
};
const referralConfig = { referralBonus: 0.1, referralDiscount: 0.1 };
const main = async () => {
  console.log('init data');
  // web3Listener
  await firestore.collection('web3Listener').doc('8453').set({ lastBlock: 0 });
  // system config
  console.log('create system configs');
  const activeSeasonId = firestore.collection('season').doc().id;
  await firestore
    .collection('system')
    .doc('default')
    .set({
      ...assetsConfig,
      activeSeasonId,
      appVersion: '0.9.9',
    });
  await firestore.collection('system').doc('market').set({
    ethPriceInUsd: '2471.94',
    nftPrice: '0.001',
    tokenPrice: '0.00001',
  });
  await firestore
    .collection('system')
    .doc('estimated-gas')
    .set({
      game: { mint: 0, buyGoon: 0, buySafeHouse: 0 },
    });
  await firestore.collection('system').doc('data').set({ nonce: 0 });
  console.log('created system configs');

  console.log('create season');
  const now = Date.now();
  const endTimeUnix = Date.now() + 5 * 24 * 60 * 60 * 1000;
  const startTime = admin.firestore.Timestamp.fromMillis(now);
  const estimatedEndTime = admin.firestore.Timestamp.fromMillis(endTimeUnix);
  await firestore
    .collection('season')
    .doc(activeSeasonId)
    .set({
      name: 'Season #1',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      startTime,
      estimatedEndTime,
      claimGapInSeconds: 300,
      rankPrizePool: 0,
      reputationPrizePool: 0,
      burnValue: 0,
      devFee: 0,
      reservePool: 0,
      reservePoolReward: 0.01,
      timeStepInHours: 0.25,
      machineSold: 0,
      workerSold: 0,
      buildingSold: 0,
      ...assetsConfig,
      status: 'open',
      houseLevels: [
        { networthStart: 0, networthEnd: 24, level: 1 },
        { networthStart: 25, networthEnd: 49, level: 2 },
        { networthStart: 50, networthEnd: 74, level: 3 },
        { networthStart: 75, networthEnd: 99, level: 4 },
        { networthStart: 100, networthEnd: 124, level: 5 },
        { networthStart: 125, networthEnd: 149, level: 6 },
        { networthStart: 150, networthEnd: 199, level: 7 },
        { networthStart: 200, networthEnd: 249, level: 8 },
        { networthStart: 250, networthEnd: 349, level: 9 },
        { networthStart: 350, networthEnd: 499, level: 10 },
        { networthStart: 500, networthEnd: 749, level: 11 },
        { networthStart: 750, networthEnd: 1249, level: 12 },
        { networthStart: 1250, networthEnd: 1999, level: 13 },
        { networthStart: 2000, networthEnd: 4999, level: 14 },
        { networthStart: 5000, level: 15 },
      ],
      tokenAddress: TOKEN_ADDRESS,
      nftAddress: NFT_ADDRESS,
      gameAddress: GAME_CONTRACT_ADDRESS,
      routerAddress: ROUTER_ADDRESS,
      wethAddress: WETH_ADDRESS,
      pairAddress: PAIR_ADDRESS,
      prizePoolConfig,
      warConfig,
      referralConfig,
    });
  console.log('created season');

  console.log('create season log');
  await firestore
    .collection('season')
    .doc(activeSeasonId)
    .collection('log')
    .add({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      type: 'start-season',
      text: `Season has started at ${moment(new Date(now)).format('DD/MM/YYYY HH:mm')}`,
      metadata: {
        startTime,
        estimatedEndTime,
        rankPrizePool: 0,
        reputationPrizePool: 0,
        burnValue: 0,
        devFee: 0,
        reservePool: 0,
        machineSold: 0,
        workerSold: 0,
        buildingSold: 0,
        prizePoolConfig,
        warConfig,
        referralConfig,
        ...assetsConfig,
      },
    });
  console.log('created season log');
  const userSnapshot = await firestore.collection('user').get();
  for (let user of userSnapshot.docs) {
    await firestore.collection('user').doc(user.id).update({
      tokenBalance: 0,
    });
  }

  console.log('done!');
};

main()
  .then(process.exit)
  .catch((err) => console.error(err));
