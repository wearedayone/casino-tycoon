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
        basePrice: 0.069,
        dailyReward: 500,
        networth: 6,
      },
      worker: { basePrice: 1000, dailyReward: 1000, networth: 1 },
      building: { basePrice: 1000, dailyReward: 0, networth: 10 },
      nftAddress: '0x',
      tokenAddress: '0x',
      gameContractAddress: '0x',
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
      prizePool: 0,
      reversePool: 0,
      machineSold: 0,
      workerSold: 0,
      buildingSold: 0,
      machine: {
        basePrice: 0.069,
        dailyReward: 500,
        networth: 6,
      },
      worker: { basePrice: 1000, dailyReward: 1000, networth: 1 },
      building: { basePrice: 1000, dailyReward: 0, networth: 10 },
      status: 'open',
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
        reversePool: 0,
        machineSold: 0,
        workerSold: 0,
        buildingSold: 0,
        machine: {
          basePrice: 0.069,
          dailyReward: 500,
          networth: 6,
        },
        worker: { basePrice: 1000, dailyReward: 1000, networth: 1 },
        building: { basePrice: 1000, dailyReward: 0, networth: 10 },
      },
    });
  console.log('created season log');

  console.log('done!');
};

main()
  .then(process.exit)
  .catch((err) => console.error(err));
