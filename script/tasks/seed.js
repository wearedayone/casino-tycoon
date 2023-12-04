import moment from 'moment';

import admin, { firestore } from '../configs/admin.config.js';
import environments from '../utils/environments.js';

const { ENVIRONMENT } = environments;
const rankingRewards =
  ENVIRONMENT === 'production'
    ? [
        { rankStart: 1, rankEnd: 1, share: 0.2 },
        { rankStart: 2, rankEnd: 2, share: 0.14 },
        { rankStart: 3, rankEnd: 3, share: 0.1 },
        { rankStart: 4, rankEnd: 4, share: 0.07 },
        { rankStart: 5, rankEnd: 5, share: 0.05 },
        { rankStart: 6, rankEnd: 6, share: 0.04 },
        { rankStart: 7, rankEnd: 7, share: 0.03 },
        { rankStart: 8, rankEnd: 8, share: 0.015 },
        { rankStart: 9, rankEnd: 9, share: 0.01 },
        { rankStart: 10, rankEnd: 15, share: 0.0075 },
        { rankStart: 16, rankEnd: 25, share: 0.005 },
        { rankStart: 26, rankEnd: 50, share: 0.003 },
        { rankStart: 51, rankEnd: 100, share: 0.0015 },
      ]
    : [
        { rankStart: 1, rankEnd: 1, share: 0.3 },
        { rankStart: 2, rankEnd: 2, share: 0.2 },
        { rankStart: 3, rankEnd: 3, share: 0.14 },
        { rankStart: 4, rankEnd: 4, share: 0.1 },
        { rankStart: 5, rankEnd: 5, share: 0.07 },
        { rankStart: 6, rankEnd: 6, share: 0.06 },
        { rankStart: 7, rankEnd: 7, share: 0.05 },
        { rankStart: 8, rankEnd: 8, share: 0.04 },
        { rankStart: 9, rankEnd: 9, share: 0.03 },
        { rankStart: 10, rankEnd: 10, share: 0.02 },
      ];
const main = async () => {
  console.log('init data');
  // web3Listener
  await firestore.collection('web3Listener').doc('84531').set({ lastBlock: 0 });
  // system config
  console.log('create system configs');
  const activeSeasonId = firestore.collection('season').doc().id;
  await firestore
    .collection('system')
    .doc('default')
    .set({
      machine: {
        basePrice: 0.0069, // for staging
        dailyReward: 1000,
        networth: 10,
      },
      worker: { basePrice: 1000, priceStep: 5, dailyReward: 500, networth: 3 },
      building: { basePrice: 3000, priceStep: 10, dailyReward: 0, networth: 8 },
      activeSeasonId,
      appVersion: '0.9.1',
    });
  await firestore.collection('system').doc('market').set({
    nftPrice: '0.0042',
    tokenPrice: '0.00001',
  });
  await firestore.collection('system').doc('data').set({ nonce: 0 });
  console.log('created system configs');

  console.log('create season');
  const now = Date.now();
  const endTimeUnix = Date.now() + 10 * 24 * 60 * 60 * 1000;
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
      claimGapInSeconds: 30,
      prizePool: 0,
      reservePool: 0,
      reservePoolReward: 0.01,
      timeStepInHours: 1,
      machineSold: 0,
      workerSold: 0,
      buildingSold: 0,
      machine: {
        basePrice: 0.0069, // for staging
        dailyReward: 1000,
        networth: 10,
      },
      worker: { basePrice: 1000, priceStep: 5, dailyReward: 500, networth: 3 },
      building: { basePrice: 3000, priceStep: 10, dailyReward: 0, networth: 8 },
      status: 'open',
      rankingRewards,
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
        prizePool: 0,
        reservePool: 0,
        machineSold: 0,
        workerSold: 0,
        buildingSold: 0,
        machine: {
          basePrice: 0.0069,
          dailyReward: 1000,
          networth: 10,
        },
        worker: { basePrice: 1000, priceStep: 5, dailyReward: 500, networth: 3 },
        building: { basePrice: 3000, priceStep: 10, dailyReward: 0, networth: 8 },
      },
    });
  console.log('created season log');

  console.log('done!');
};

main()
  .then(process.exit)
  .catch((err) => console.error(err));
