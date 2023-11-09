import moment from 'moment';

import admin, { firestore } from '../configs/admin.config.js';

const main = async () => {
  console.log('init data');

  console.log('create system configs');
  const activeSeasonId = firestore.collection('season').doc().id;
  await firestore
    .collection('system')
    .doc('default')
    .set({
      machine: {
        basePrice: 0.00069, // for staging
        dailyReward: 500,
        networth: 6,
      },
      worker: { basePrice: 1000, priceStep: 100, dailyReward: 1000, networth: 1 },
      building: { basePrice: 1000, priceStep: 100, dailyReward: 0, networth: 10 },
      activeSeasonId,
      appVersion: '1.0.0',
    });
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
        basePrice: 0.00069, // for staging
        dailyReward: 500,
        networth: 6,
      },
      worker: { basePrice: 1000, priceStep: 100, dailyReward: 1000, networth: 1 },
      building: { basePrice: 1000, priceStep: 100, dailyReward: 0, networth: 10 },
      status: 'open',
      rankingRewards: [
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
          basePrice: 0.069,
          dailyReward: 500,
          networth: 6,
        },
        worker: { basePrice: 1000, priceStep: 100, dailyReward: 1000, networth: 1 },
        building: { basePrice: 1000, priceStep: 100, dailyReward: 0, networth: 10 },
      },
    });
  console.log('created season log');

  console.log('done!');
};

main()
  .then(process.exit)
  .catch((err) => console.error(err));
