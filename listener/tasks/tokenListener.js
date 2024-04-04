import { Contract } from '@ethersproject/contracts';
import { formatEther } from '@ethersproject/units';

import tokenABI from '../assets/abis/Token.json' assert { type: 'json' };
import admin, { firestore } from '../configs/firebase.config.js';
import provider from '../configs/provider.config.js';
import environments from '../utils/environments.js';
import logger from '../utils/logger.js';
import { getActiveSeason } from '../services/season.service.js';

const { NETWORK_ID } = environments;

const tokenListener = async () => {
  const activeSeason = await getActiveSeason();
  const { tokenAddress: TOKEN_ADDRESS } = activeSeason || {};
  logger.info(`Start listen contract ${TOKEN_ADDRESS} on Network ${NETWORK_ID}`);
  const contract = new Contract(TOKEN_ADDRESS, tokenABI.abi, provider);

  contract.on('Transfer', async (from, to, value, event) => {
    console.log('Transfer', { from, to, value, event });
    await firestore.collection('web3Listener').doc(NETWORK_ID).set({ lastBlock: event.blockNumber });
    await processTransferEvent({ from, to, value, event, contract });
  });
};

export const queryEvent = async (fromBlock) => {
  const activeSeason = await getActiveSeason();
  const { tokenAddress: TOKEN_ADDRESS } = activeSeason || {};
  const contract = new Contract(TOKEN_ADDRESS, tokenABI.abi, provider);
  const depositEvents = await contract.queryFilter('Transfer', fromBlock);
  for (const event of depositEvents) {
    const [from, to, value] = event.args;
    // console.log({ wallet, amount });
    await processTransferEvent({ from, to, value, event, contract });
  }
};

const processTransferEvent = async ({ from, to, value, event, contract }) => {
  try {
    const activeSeason = await getActiveSeason();
    const { gameAddress: GAME_CONTRACT_ADDRESS } = activeSeason || {};

    logger.info('Token Transfer');
    logger.info({ from, to, value, event });
    const { transactionHash } = event;
    const newBalanceFrom = await contract.balanceOf(from);
    if (from.toLowerCase() == GAME_CONTRACT_ADDRESS.toLowerCase()) {
      updatePoolReserve({
        newBalance: parseFloat(formatEther(newBalanceFrom)).toFixed(6),
      });
    } else {
      await updateBalance({
        address: from.toLowerCase(),
        newBalance: parseFloat(formatEther(newBalanceFrom)).toFixed(6),
      });
    }

    const newBalanceTo = await contract.balanceOf(to);
    if (to.toLowerCase() == GAME_CONTRACT_ADDRESS.toLowerCase()) {
      updatePoolReserve({
        newBalance: parseFloat(formatEther(newBalanceTo)).toFixed(6),
      });
    } else {
      await updateBalance({
        address: to.toLowerCase(),
        newBalance: parseFloat(formatEther(newBalanceTo)).toFixed(6),
      });
    }
  } catch (err) {
    logger.error(err);
  }
};

const updateBalance = async ({ address, newBalance }) => {
  logger.info({ address, newBalance: Number(newBalance) });
  const user = await firestore.collection('user').where('address', '==', address).limit(1).get();
  if (user.empty) return;
  const userId = user.docs[0].id;
  await firestore
    .collection('user')
    .doc(userId)
    .update({
      tokenBalance: Number(newBalance),
    });
};

const updatePoolReserve = async ({ newBalance }) => {
  logger.info({ newBalance: Number(newBalance) });
  const system = await firestore.collection('system').doc('default').get();
  if (!system.exists) return;
  const { activeSeasonId } = system.data();
  await firestore
    .collection('season')
    .doc(activeSeasonId)
    .update({
      reservePool: Number(newBalance),
    });
};

const createTransaction = async ({ address, ...data }) => {
  const system = await firestore.collection('system').doc('default').get();
  const { activeSeasonId } = system.data();

  const user = await firestore.collection('user').where('address', '==', address).limit(1).get();
  if (!user.empty) {
    await firestore.collection('transaction').add({
      userId: user.docs[0].id,
      seasonId: activeSeasonId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ...data,
    });
  }
};

export default tokenListener;
