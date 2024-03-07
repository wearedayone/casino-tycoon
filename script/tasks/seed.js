import moment from 'moment';

import admin, { firestore } from '../configs/admin.config.js';
import gameConfigs from '../configs/game.config.json' assert { type: 'json' };
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
      appReloadThresholdInSeconds: 10,
      appVersion: '0.9.3.0',
      disabledUrls: ['gangsterarena.com', 'demo.gangsterarena.com'],
    });
  await firestore.collection('system').doc('market').set({
    ethPriceInUsd: '3000',
    nftPrice: '0.005',
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
  const startTimeUnix = Date.now();
  const endTimeUnix = startTimeUnix + gameConfigs.initGameDurationInDays * 24 * 60 * 60 * 1000;
  const startTime = admin.firestore.Timestamp.fromMillis(startTimeUnix);
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
