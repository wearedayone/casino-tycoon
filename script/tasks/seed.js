import admin, { firestore } from '../configs/admin.config.js';
import gameConfigs from '../configs/game.config.json' assert { type: 'json' };
import templates from '../assets/jsons/templates.json' assert { type: 'json' };
import environments from '../utils/environments.js';
import { calculateNextBuildingBuyPriceBatch, calculateNextWorkerBuyPriceBatch } from '../utils/formulas.js';

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
      game: { buyGangster: 0, buyGoon: 0, buySafeHouse: 0 },
      swap: { swapEthToFiat: 0 },
    });
  // await firestore
  //   .collection('system')
  //   .doc('data')
  //   .set({ nonce: admin.firestore.FieldValue.increment(1) });
  console.log('created system configs');
  console.log('create templates');
  const templatePromises = Object.keys(templates).map((key) =>
    firestore.collection('template').doc(key).set({ text: templates[key] })
  );
  await Promise.all(templatePromises);
  console.log('created templates');

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
      spinRewards: gameConfigs.spinRewards,
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
      spinPrice: gameConfigs.spinPrice,
    });
  console.log('created season');

  // init system txn for worker and building
  const initStartTimeTxn = startTimeUnix - 12 * 60 * 60 * 1000;
  const txnTimes = [
    initStartTimeTxn,
    ...Array.from({ length: 11 }, (_, index) => startTimeUnix + index * 60 * 60 * 1000),
  ];
  const initWorkerPurchased = Array(12).fill(gameConfigs.initPurchased.worker);
  const initBuildingPurchased = Array(12).fill(gameConfigs.initPurchased.building);
  const { worker, building } = gameConfigs.assets;

  console.log('create worker purchased txns');
  const workerTxnsData = initWorkerPurchased.map((quantity, index) => {
    const salesLastPeriod = initWorkerPurchased.slice(0, index).reduce((total, item) => total + item, 0);
    const { total, prices } = calculateNextWorkerBuyPriceBatch(
      salesLastPeriod,
      worker.targetDailyPurchase,
      worker.targetPrice,
      worker.basePrice,
      quantity
    );

    return { salesLastPeriod, total, prices, amount: quantity, time: txnTimes[index] };
  });
  const initWorkerTxnPromises = workerTxnsData.map((item) =>
    firestore.collection('transaction').add({
      createdAt: admin.firestore.Timestamp.fromMillis(item.time),
      seasonId: activeSeasonId,
      userId: 'admin',
      type: 'buy-worker',
      nonce: 0,
      txnHash: '',
      status: 'Success',
      amount: item.amount,
      token: 'FIAT',
      currentSold: item.salesLastPeriod,
      value: item.total,
      prices: item.prices,
      isInitPurchased: true,
    })
  );
  await Promise.all(initWorkerTxnPromises);
  console.log('created worker purchased txns');

  console.log('create building purchased txns');
  const buildingTxnsData = initBuildingPurchased.map((quantity, index) => {
    const salesLastPeriod = initBuildingPurchased.slice(0, index).reduce((total, item) => total + item, 0);
    const { total, prices } = calculateNextBuildingBuyPriceBatch(
      salesLastPeriod,
      building.targetDailyPurchase,
      building.targetPrice,
      building.basePrice,
      quantity
    );

    return { salesLastPeriod, total, prices, amount: quantity, time: txnTimes[index] };
  });
  const initBuildingTxnPromises = buildingTxnsData.map((item) =>
    firestore.collection('transaction').add({
      createdAt: admin.firestore.Timestamp.fromMillis(item.time),
      seasonId: activeSeasonId,
      userId: 'admin',
      type: 'buy-building',
      nonce: 0,
      txnHash: '',
      status: 'Success',
      amount: item.amount,
      token: 'FIAT',
      currentSold: item.salesLastPeriod,
      value: item.total,
      prices: item.prices,
      isInitPurchased: true,
    })
  );
  await Promise.all(initBuildingTxnPromises);
  console.log('created building purchased txns');

  // reset user token balance
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
