import { getActiveSeason } from '../utils/utils.js';
import admin, { firestore } from '../configs/admin.config.js';
import alchemy from '../configs/alchemy.config.js';
import environments from '../utils/environments.js';
import { Contract } from '@ethersproject/contracts';
import GangsterArenaABI from '../assets/abis/GameContract.json' assert { type: 'json' };

const { GAME_CONTRACT_ADDRESS } = environments;

const main = async () => {
  try {
    console.log('Start patching transaction');
    await patchTransaction({ type: 'buy-worker', eventName: 'BuyGoon' });
    await patchTransaction({ type: 'buy-building', eventName: 'BuySafeHouse' });
    await patchMintEvent({ type: 'buy-machine', eventName: 'BuySafeHouse' });

    console.log(`Query pending transaction`);
    const snapshotTxn = await firestore.collection('transaction').where('status', '==', 'Pending').get();
    if (!snapshotTxn.empty) {
      console.log(snapshotTxn.docs.length);
    }
  } catch (err) {
    console.log({ err });
  }
};

const patchTransaction = async ({ type, eventName }) => {
  const activeSeason = await getActiveSeason();
  const { id: activeSeasonId } = activeSeason;
  const ethersProvider = await alchemy.config.getWebSocketProvider();
  const contract = new Contract(GAME_CONTRACT_ADDRESS, GangsterArenaABI.abi, ethersProvider);
  console.log('Filtering transaction', GAME_CONTRACT_ADDRESS);
  const BuyGoonEvents = await contract.queryFilter(eventName, 0);
  console.log(`process ${BuyGoonEvents.length} events`);
  let count = 1;
  for (const event of BuyGoonEvents) {
    console.log(`Process ${count++}/${BuyGoonEvents.length}`);
    const [to, amount, nonce] = event.args;
    // console.log({ wallet, amount });
    //   console.log({ to, amount, nonce });
    const snapshot = await firestore
      .collection('transaction')
      .where('seasonId', '==', activeSeasonId)
      .where('type', '==', type)
      .where('amount', '==', amount.toNumber())
      .where('nonce', '==', nonce.toNumber())
      .limit(1)
      .get();
    if (!snapshot.empty) {
      const { status } = snapshot.docs[0].data();
      if (status !== 'Success') {
        await firestore
          .collection('transaction')
          .doc(snapshot.docs[0].id)
          .update({ status: 'Success', txnHash: event.transactionHash });
      } else {
        await firestore.collection('transaction').doc(snapshot.docs[0].id).update({ txnHash: event.transactionHash });
      }
    } else {
      console.log('No transaction');
    }
  }
};

const patchMintEvent = async ({ type, eventName }) => {
  const activeSeason = await getActiveSeason();
  const { id: activeSeasonId } = activeSeason;
  const ethersProvider = await alchemy.config.getWebSocketProvider();
  const contract = new Contract(GAME_CONTRACT_ADDRESS, GangsterArenaABI.abi, ethersProvider);
  console.log('Filtering transaction', GAME_CONTRACT_ADDRESS);
  const BuyGoonEvents = await contract.queryFilter(eventName, 0);
  console.log(`process ${BuyGoonEvents.length} events`);
  let count = 1;
  for (const event of BuyGoonEvents) {
    console.log(`Process ${count++}/${BuyGoonEvents.length}`);
    const [to, tokenId, amount] = event.args;
    const snapshot = await firestore
      .collection('transaction')
      .where('seasonId', '==', activeSeasonId)
      .where('type', '==', type)
      .where('amount', '==', amount.toNumber())
      .where('nonce', '==', nonce.toNumber())
      .limit(1)
      .get();
    if (!snapshot.empty) {
      const { status } = snapshot.docs[0].data();
      if (status !== 'Success') {
        console.log('Update status');
        await firestore
          .collection('transaction')
          .doc(snapshot.docs[0].id)
          .update({ status: 'Success', txnHash: event.transactionHash });
      } else {
        console.log('Update hash');
        await firestore.collection('transaction').doc(snapshot.docs[0].id).update({ txnHash: event.transactionHash });
      }
    } else {
      console.log('No transaction');
    }
  }
};

const patchWithdrawNFTTransaction = async () => {
  const activeSeason = await getActiveSeason();
  const { id: activeSeasonId } = activeSeason;
  const ethersProvider = await alchemy.config.getWebSocketProvider();
  const contract = new Contract(GAME_CONTRACT_ADDRESS, GangsterArenaABI.abi, ethersProvider);
  console.log('Filtering transaction', GAME_CONTRACT_ADDRESS);
  const WithdrawNFTEvents = await contract.queryFilter('Withdraw', 0);
  console.log(`process ${WithdrawNFTEvents.length} events`);
  let count = 1;
  for (const event of WithdrawNFTEvents) {
    console.log(`Process ${count++}/${WithdrawNFTEvents.length}`);
    const [to, tokenId, amount] = event.args;

    console.log({ to, tokenId, amount, event, txnHash: event.transactionHash });

    const snapshot = await firestore
      .collection('transaction')
      .where('seasonId', '==', activeSeasonId)
      .where('txnHash', '==', event.transactionHash)
      .limit(1)
      .get();
    if (!snapshot.empty) {
      const { status } = snapshot.docs[0].data();
      if (status !== 'Success') {
        console.log('Update Status Success');
        await firestore.collection('transaction').doc(snapshot.docs[0].id).update({ status: 'Success' });
      }
    } else {
      console.log('Create transaction');
      const userSnapshot = await firestore
        .collection('user')
        .where('address', '==', to.toString().toLowerCase())
        .limit(1)
        .get();
      if (userSnapshot.empty) {
        continue;
      }
      const userId = userSnapshot.docs[0].id;
      console.log({
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        seasonId: activeSeasonId,
        status: 'Success',
        txnHash: '0xf74159429ad3bff39a91e50f55c1508f37ea2060e9c267c12a73440d202db891',
        type: 'withdraw-nft',
        userId: userId,
        amount: amount.toNumber(),
      });
      //   const snapshot = await firestore.collection('transaction').doc().set({
      //     createdAt: admin.firestore.FieldValue.serverTimestamp(),
      //     seasonId: activeSeasonId,
      //     status: 'Success',
      //     txnHash: '0xf74159429ad3bff39a91e50f55c1508f37ea2060e9c267c12a73440d202db891',
      //     type: 'withdraw-nft',
      //     userId: userId,
      //     amount: amount,
      //   });
    }
  }
};

// patchWithdrawNFTTransaction();
main();
