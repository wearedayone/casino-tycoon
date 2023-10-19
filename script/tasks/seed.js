import moment from 'moment';

import admin, { firestore } from '../configs/admin.config.js';

const main = async () => {
  console.log('init data');

  console.log('create system configs');
  const activePoolId = firestore.collection('pool').doc().id;
  await firestore
    .collection('system')
    .doc('default')
    .set({
      machine: {
        networkId: '84531',
        token: 'ETH',
        basePrice: 0.069,
        dailyReward: 500,
        networth: 6,
      },
      worker: { basePrice: 1000, dailyReward: 1000, networth: 1 },
      building: { basePrice: 1000, dailyReward: 0, networth: 10 },
      nftAddress: '0x',
      tokenAddress: '0x',
      activePoolId,
    });
  console.log('created system configs');

  console.log('create pool');
  const now = Date.now();
  const endTimeUnix = Date.now() + 10 * 24 * 60 * 60 * 1000;
  const startTime = admin.firestore.Timestamp.fromMillis(now);
  const estimatedEndTime = admin.firestore.Timestamp.fromMillis(endTimeUnix);
  const activeSessionId = moment().format('DD/MM/YYYY');
  await firestore
    .collection('pool')
    .doc(activePoolId)
    .set({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      startTime,
      estimatedEndTime,
      prizePool: 0,
      tokenUsed: 0,
      machineSold: 0,
      workerSold: 0,
      buildingSold: 0,
      machine: {
        networkId: '84531',
        token: 'ETH',
        basePrice: 0.069,
        dailyReward: 500,
        networth: 6,
      },
      worker: { basePrice: 1000, dailyReward: 1000, networth: 1 },
      building: { basePrice: 1000, dailyReward: 0, networth: 10 },
      activeSessionId,
      status: 'open',
    });
  console.log('created pool');

  console.log('create pool session');
  const sessionEndTimeUnix = now + 24 * 60 * 60 * 1000;
  const sessionStartTime = admin.firestore.Timestamp.fromMillis(now);
  const sessionEndTime =
    admin.firestore.Timestamp.fromMillis(sessionEndTimeUnix);
  await firestore
    .collection('pool')
    .doc(activePoolId)
    .collection('session')
    .doc(activeSessionId)
    .set({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      startTime: sessionStartTime,
      endTime: sessionEndTime,
      mode: 'normal',
      votingEndTime: sessionStartTime,
      status: 'open',
    });
  console.log('created pool session');

  console.log('create pool log');
  await firestore
    .collection('pool')
    .doc(activePoolId)
    .collection('log')
    .add({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      type: 'start-pool',
      text: `Pool has started at ${moment(new Date(now)).format(
        'DD/MM/YYYY HH:mm'
      )}`,
      metadata: {
        startTime,
        estimatedEndTime,
        prizePool: 0,
        tokenUsed: 0,
        machineSold: 0,
        workerSold: 0,
        buildingSold: 0,
        machine: {
          networkId: '84531',
          token: 'ETH',
          basePrice: 0.069,
          dailyReward: 500,
          networth: 6,
        },
        worker: { basePrice: 1000, dailyReward: 1000, networth: 1 },
        building: { basePrice: 1000, dailyReward: 0, networth: 10 },
      },
    });
  console.log('created pool log');

  console.log('creating user');
  const userId = '0x65355c36a566bdd9912118f35de2c94cef2dbcf4';
  await firestore
    .collection('user')
    .doc(userId)
    .set({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      username: 'jack.handsome',
      avatarURL: '',
      point: 0,
      balances: [
        { networkId: '84531', token: 'ETH', balance: 0.5 },
        { networkId: '84531', token: 'CHIP', balance: 1234 },
      ],
    });
  console.log('created user');

  console.log('create asset');
  await firestore
    .collection('user')
    .doc(userId)
    .collection('pool')
    .doc(activePoolId)
    .collection('machine')
    .add({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      startTime: admin.firestore.FieldValue.serverTimestamp(),
      dailyReward: 500,
      networth: 6,
    });

  await firestore
    .collection('user')
    .doc(userId)
    .collection('pool')
    .doc(activePoolId)
    .collection('worker')
    .add({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      startTime: admin.firestore.FieldValue.serverTimestamp(),
      dailyReward: 1000,
      networth: 1,
    });

  await firestore
    .collection('user')
    .doc(userId)
    .collection('pool')
    .doc(activePoolId)
    .collection('building')
    .add({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      networth: 10,
    });
  console.log('created asset');

  console.log('create gamePlay');
  await firestore.collection('gamePlay').add({
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    poolId: activePoolId,
    userId,
    networth: 0,
    numberOfMachines: 1,
    numberOfWorkers: 1,
    numberOfBuildings: 1,
    lastClaimTime: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('created gamePlay');

  console.log('done!');
};

main()
  .then(process.exit)
  .catch((err) => console.error(err));
