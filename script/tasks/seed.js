import moment from 'moment';

import admin, { firestore } from '../configs/admin.config.js';
import gameConfigs from '../configs/game.config.js';
import environments from '../utils/environments.js';

const { TOKEN_ADDRESS, NFT_ADDRESS, GAME_CONTRACT_ADDRESS, ROUTER_ADDRESS, WETH_ADDRESS, PAIR_ADDRESS } = environments;

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
      ...gameConfigs.assets,
      openseaNftCollection: gameConfigs.openseaNftCollection,
      activeSeasonId,
      appVersion: '0.9.2.10',
      disabledUrls: ['gangsterarena.com'],
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
  // await firestore
  //   .collection('system')
  //   .doc('data')
  //   .set({ nonce: admin.firestore.FieldValue.increment(1) });
  console.log('created system configs');

  console.log('create season');
  const now = Date.now();
  const endTimeUnix = Date.now() + 14 * 24 * 60 * 60 * 1000;
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
      claimGapInSeconds: gameConfigs.claimGapInSeconds,
      rankPrizePool: 0,
      reputationPrizePool: 0,
      burnValue: 0,
      devFee: 0,
      reservePool: 0,
      reservePoolReward: 0.01,
      timeStepInMinutes: gameConfigs.timeStepInMinutes,
      machineSold: 0,
      workerSold: 0,
      buildingSold: 0,
      ...gameConfigs.assets,
      status: 'open',
      houseLevels: gameConfigs.houseLevels,
      openseaNftCollection: gameConfigs.openseaNftCollection,
      tokenAddress: TOKEN_ADDRESS,
      nftAddress: NFT_ADDRESS,
      gameAddress: GAME_CONTRACT_ADDRESS,
      routerAddress: ROUTER_ADDRESS,
      wethAddress: WETH_ADDRESS,
      pairAddress: PAIR_ADDRESS,
      prizePoolConfig: gameConfigs.prizePool,
      warConfig: gameConfigs.war,
      referralConfig: gameConfigs.referral,
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
        openseaNftCollection: gameConfigs.openseaNftCollection,
        prizePoolConfig: gameConfigs.prizePool,
        warConfig: gameConfigs.war,
        referralConfig: gameConfigs.referral,
        ...gameConfigs.assets,
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
