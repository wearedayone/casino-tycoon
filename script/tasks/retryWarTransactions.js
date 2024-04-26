import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import { parseEther } from '@ethersproject/units';
import { getParsedEthersError } from '@enzoferey/ethers-error-parser';

import gameContractABI from '../assets/abis/GameContract.json' assert { type: 'json' };
import tokenABI from '../assets/abis/Token.json' assert { type: 'json' };
import nftABI from '../assets/abis/NFT.json' assert { type: 'json' };
import admin, { firestore } from '../configs/admin.config.js';
import alchemy from '../configs/alchemy.config.js';
import environments from '../utils/environments.js';
import { getAccurate } from '../utils/math.js';
import moment from 'moment';

const { WALLET_PRIVATE_KEY } = environments;

const getActiveSeasonId = async () => {
  const snapshot = await firestore.collection('system').doc('default').get();
  const configs = snapshot.data();

  return configs.activeSeasonId;
};

const warId = '20240325-010005'; // prd failed war
// const warId = '20240317-010000'; // stg
const main = async () => {
  const seasonId = await getActiveSeasonId();
  const failedWar = await firestore.collection('warSnapshot').doc(warId).get();
  const time = failedWar.data().createdAt;
  console.log({ time });
  const nextElevenHours = moment(time.toDate()).add(11, 'hour');
  const timestamp = admin.firestore.Timestamp.fromMillis(nextElevenHours);

  const txnSnapshot = await firestore
    .collection('transaction')
    .where('type', 'in', ['war-bonus', 'war-penalty'])
    .where('seasonId', '==', seasonId)
    .where('createdAt', '>=', time)
    .where('createdAt', '<', timestamp)
    .get();

  const txns = txnSnapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter(({ status }) => status === 'Failed');

  const bonusTxns = txns.filter(({ type }) => type === 'war-bonus');
  const penaltyTxns = txns.filter(({ type }) => type === 'war-penalty');
  console.log('failed txns:', txns.length);
  console.log('\twar-bonus: ', bonusTxns.length);
  console.log('\twar-penalty: ', penaltyTxns.length);

  // await claimWarReward(bonusTxns);
  await burnMachinesLost(penaltyTxns);
};

main();

export const initTransaction = async ({ userId, type, ...data }) => {
  console.log(`init transaction user:${userId} - type:${type}`);
  const activeSeason = await getActiveSeason();

  const txnData = {};
  switch (type) {
    case 'war-bonus':
      txnData.value = data.value;
      txnData.gainedReputation = data.gainedReputation;
      txnData.token = 'GREED';
      break;
    case 'war-penalty':
      const { machinesDeadCount } = data;
      txnData.machinesDeadCount = machinesDeadCount;
      break;
    default:
      break;
  }

  // TODO: fix duplicate nonce
  await firestore
    .collection('system')
    .doc('data')
    .update({
      nonce: admin.firestore.FieldValue.increment(1),
    });
  const systemData = await firestore.collection('system').doc('data').get();
  const { nonce } = systemData.data();
  const transaction = {
    userId,
    seasonId: activeSeason.id,
    type,
    txnHash: '',
    status: 'Pending',
    nonce,
    ...txnData,
  };
  const newTransaction = await firestore.collection('transaction').add({
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    ...transaction,
  });

  return { id: newTransaction.id, ...transaction };
};

export const claimWarReward = async (bonusTxns) => {
  if (!bonusTxns.length) return;

  const userIds = bonusTxns.map((item) => item.userId);
  const userPromises = userIds.map((id) => firestore.collection('user').doc(id).get());
  const userSnapshots = await Promise.all(userPromises);
  const users = [];
  for (const [index, oldTxn] of bonusTxns.entries()) {
    const snapshot = userSnapshots[index];
    // const txn = await initTransaction({
    //   userId: snapshot.id,
    //   type: 'war-bonus',
    //   value: oldTxn.value,
    //   gainedReputation: oldTxn.gainedReputation,
    // });

    users.push({
      userId: snapshot.id,
      txnId: oldTxn.id,
      address: snapshot.data().address,
      amount: oldTxn.value,
    });
  }

  const addresses = users.map((item) => item.address);
  const amounts = users.map((item) => parseEther(`${item.amount}`));
  console.log({ users });
  // const { txnHash, status } = await claimTokenBatch({ addresses, amounts });
  // console.log({ txnHash, status });
  // // console.log(`War bonus, ${JSON.stringify({ addresses, amounts })}`);
  // // let txnHash = '0x23feaa28a35aeebea09e0d11795b1d053dfe88992485f3387a99403404a6add1';
  // // let status = 'Success';
  // const updateTxnPromises = users.map((item) => {
  //   return firestore.collection('transaction').doc(item.txnId).update({
  //     txnHash,
  //     status,
  //   });
  // });

  // await Promise.all(updateTxnPromises);

  // if (status === 'Success') {
  //   const updateUserGamePlayPromises = users.map((item) =>
  //     validateNonWeb3Transaction({ userId: item.userId, transactionId: item.txnId })
  //   );
  //   await Promise.all(updateUserGamePlayPromises);
  // }
};

export const burnMachinesLost = async (penaltyTxns) => {
  if (!penaltyTxns.length) return;

  const userIds = penaltyTxns.map((item) => item.userId);
  const userPromises = userIds.map((id) => firestore.collection('user').doc(id).get());
  const userSnapshots = await Promise.all(userPromises);
  const users = [];
  for (const index in userSnapshots) {
    const snapshot = userSnapshots[index];
    if (!snapshot.exists) continue;

    const nft = await getNFTBalance({ address: snapshot.data().address });
    const nftBalance = nft.toNumber();
    console.log({ nftBalance });
    const burnNumer = Math.min(nftBalance, penaltyTxns[index].machinesDeadCount);
    if (burnNumer == 0) continue;
    // const txn = await initTransaction({
    //   userId: snapshot.id,
    //   type: 'war-penalty',
    //   machinesDeadCount: burnNumer,
    // });

    users.push({
      userId: snapshot.id,
      txnId: penaltyTxns[index].id,
      address: snapshot.data().address,
      amount: burnNumer,
    });
  }

  const addresses = users.map((item) => item.address);
  const ids = Array(users.length).fill(1);
  const amounts = users.map((item) => item.amount);
  // const { txnHash, status } = await burnNFT({ addresses, ids, amounts });
  // console.log({ txnHash, status });
  let txnHash = '0xfd3dc7a5b7c99255104598f40a2b813ed2d6e5d7ab4eab1955a3f4d3ec71641d';
  let status = 'Success';
  console.log(`Gangster penalties, ${JSON.stringify({ addresses, ids, amounts, txnHash, status })}`);

  const updateTxnPromises = users.map((item) => {
    return firestore.collection('transaction').doc(item.txnId).update({
      txnHash,
      status,
    });
  });

  await Promise.all(updateTxnPromises);

  // if (status === 'Success') {
  //   const updateUserGamePlayPromises = users.map((item) =>
  //     validateNonWeb3Transaction({ userId: item.userId, transactionId: item.txnId })
  //   );
  //   await Promise.all(updateUserGamePlayPromises);
  // }
};

const getActiveSeason = async () => {
  const activeSeasonId = await getActiveSeasonId();
  const snapshot = await firestore.collection('season').doc(activeSeasonId).get();

  return { id: snapshot.id, ...snapshot.data() };
};

const getWorkerWallet = async () => {
  const ethersProvider = await alchemy.config.getProvider();
  const workerWallet = new Wallet(WALLET_PRIVATE_KEY, ethersProvider);
  return workerWallet;
};

const getTokenContract = async (signer) => {
  const activeSeason = await getActiveSeason();
  const { tokenAddress: TOKEN_ADDRESS } = activeSeason || {};
  const contract = new Contract(TOKEN_ADDRESS, tokenABI.abi, signer);
  return contract;
};

const getNFTBalance = async ({ address }) => {
  const ethersProvider = await alchemy.config.getProvider();
  const activeSeason = await getActiveSeason();
  const { nftAddress } = activeSeason || {};
  const contract = new Contract(nftAddress, nftABI.abi, ethersProvider);
  const value = await contract.gangster(address);
  return value;
};

export const claimTokenBatch = async ({ addresses, amounts }) => {
  let txnHash = '';
  try {
    console.log('start claimTokenBatch');
    console.log({ addresses, amounts });
    const ethersProvider = await alchemy.config.getProvider();

    const workerWallet = await getWorkerWallet();
    const tokenContract = await getTokenContract(workerWallet);
    console.log('start Transaction:');
    const gasPrice = await ethersProvider.getGasPrice();
    const tx = await tokenContract.batchMint(addresses, amounts, { gasPrice });
    txnHash = tx.hash;
    console.log('Transaction:' + tx.hash);
    const receipt = await tx.wait();

    if (receipt.status !== 1) {
      console.error(`Unsuccessful txn: ${JSON.stringify(receipt)}`);
      throw new Error(`API error: Txn failed`);
    }

    return { txnHash, status: 'Success' };
  } catch (err) {
    console.error(err);
    const newError = getParsedEthersError(err);
    const regex = /(execution reverted: )([A-Za-z\s])*/;
    if (newError.context) {
      const message = newError.context.match(regex);
      if (message) {
        const error = new Error(message[0]);
        console.error(error.message);
      }
    } else {
      console.error(err.message);
    }

    return { txnHash, status: 'Failed' };
  }
};

export const burnNFT = async ({ addresses, ids, amounts }) => {
  let txnHash = '';
  try {
    console.log('start burnNFT');
    console.log({ addresses, ids, amounts });
    const ethersProvider = await alchemy.config.getProvider();
    const gasPrice = await ethersProvider.getGasPrice();
    const workerWallet = await getWorkerWallet();
    const gameContract = await getGameContract(workerWallet);
    console.log('start Transaction:');
    const tx = await gameContract.burnNFT(addresses, ids, amounts, { gasPrice });
    txnHash = tx.hash;
    console.log('Transaction:' + tx.hash);
    const receipt = await tx.wait();

    if (receipt.status !== 1) {
      console.error(`Unsuccessful txn: ${JSON.stringify(receipt)}`);
      throw new Error(`API error: Txn failed`);
    }

    return { txnHash, status: 'Success' };
  } catch (err) {
    console.error(err);
    const newError = getParsedEthersError(err);
    const regex = /(execution reverted: )([A-Za-z\s])*/;
    if (newError.context) {
      const message = newError.context.match(regex);
      if (message) {
        const error = new Error(message[0]);
        console.error(error.message);
      }
    } else {
      console.error(err.message);
    }

    return { txnHash, status: 'Failed' };
  }
};

const getGameContract = async (signer) => {
  const activeSeason = await getActiveSeason();
  const { gameAddress: GAME_CONTRACT_ADDRESS } = activeSeason || {};
  const contract = new Contract(GAME_CONTRACT_ADDRESS, gameContractABI.abi, signer);

  return contract;
};

export const validateNonWeb3Transaction = async ({ userId, transactionId }) => {
  // update txnHash and status for transaction doc in firestore
  await firestore.collection('transaction').doc(transactionId).update({
    status: 'Success',
  });

  // TODO: move this logic to trigger later
  await updateUserGamePlay(userId, transactionId);
};

const updateUserGamePlay = async (userId, transactionId) => {
  const snapshot = await firestore.collection('transaction').doc(transactionId).get();
  const { type } = snapshot.data();

  const activeSeason = await getActiveSeason();

  // update user number of assets && pendingReward && startRewardCountingTime
  const gamePlaySnapshot = await firestore
    .collection('gamePlay')
    .where('userId', '==', userId)
    .where('seasonId', '==', activeSeason.id)
    .limit(1)
    .get();
  const warDeploymentSnapshot = await firestore
    .collection('warDeployment')
    .where('seasonId', '==', activeSeason.id)
    .where('userId', '==', userId)
    .limit(1)
    .get();

  const userGamePlay = gamePlaySnapshot.docs[0];
  const warDeployment = warDeploymentSnapshot.docs[0]?.data() || {};
  console.debug(`userGamePlay before update: ${JSON.stringify(userGamePlay.data())}`);
  const { numberOfWorkers, numberOfMachines, numberOfBuildings } = userGamePlay.data();
  const assets = {
    numberOfBuildings,
    numberOfMachines,
    numberOfWorkers,
  };

  let gamePlayData = {};
  let warDeploymentData = {};
  switch (type) {
    case 'war-penalty':
      const { machinesDeadCount } = snapshot.data();
      assets.numberOfMachines -= machinesDeadCount;

      gamePlayData = {
        numberOfMachines: admin.firestore.FieldValue.increment(-machinesDeadCount),
      };
      warDeploymentData = {
        numberOfMachinesToAttack: warDeployment.numberOfMachinesToAttack - machinesDeadCount,
      };
      break;
    default:
      break;
  }

  /* recalculate `pendingReward` */
  if (type == 'war-penalty') {
    const generatedReward = await calculateGeneratedReward(userId);
    gamePlayData.pendingReward = admin.firestore.FieldValue.increment(generatedReward);
    gamePlayData.startRewardCountingTime = admin.firestore.FieldValue.serverTimestamp();
  }

  const isGamePlayChanged = Object.keys(gamePlayData).length > 0;
  if (isGamePlayChanged) await userGamePlay.ref.update({ ...gamePlayData });

  const isWarDeploymentChanged = Object.keys(warDeploymentData).length > 0;
  if (isWarDeploymentChanged) {
    const warDeploymentSnapshot = await admin
      .firestore()
      .collection('warDeployment')
      .where('userId', '==', userId)
      .where('seasonId', '==', activeSeason.id)
      .limit(1)
      .get();

    if (!warDeploymentSnapshot.empty) {
      await warDeploymentSnapshot.docs[0].ref.update({ ...warDeploymentData });
    }
  }
};

// utils
export const calculateGeneratedReward = async (userId) => {
  const system = await firestore.collection('system').doc('default').get();
  const { activeSeasonId } = system.data();
  const activeSeasonSnapshot = await firestore.collection('season').doc(activeSeasonId).get();
  const activeSeason = { id: activeSeasonId, ...activeSeasonSnapshot.data() };
  // if (activeSeason.status !== 'open') throw new Error('Season ended');

  const { machine } = activeSeason;

  const gamePlaySnapshot = await firestore
    .collection('gamePlay')
    .where('userId', '==', userId)
    .where('seasonId', '==', activeSeason.id)
    .limit(1)
    .get();

  const gamePlay = gamePlaySnapshot.docs[0];
  const { startRewardCountingTime, numberOfMachines, building } = gamePlay.data();

  const numberOfActiveMachines = Math.min(numberOfMachines, building?.machineCapacity || 0);
  const now = Date.now();
  const start = startRewardCountingTime.toDate().getTime();
  const diffInDays = (now - start) / (24 * 60 * 60 * 1000);

  const generatedReward = diffInDays * (numberOfActiveMachines * machine.dailyReward);
  return Math.round(generatedReward * 1000) / 1000;
};
