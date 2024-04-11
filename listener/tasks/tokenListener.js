import { Contract } from '@ethersproject/contracts';
import { formatEther } from '@ethersproject/units';

import tokenABI from '../assets/abis/Token.json' assert { type: 'json' };
import { firestore } from '../configs/firebase.config.js';
import provider from '../configs/provider.config.js';
import environments from '../utils/environments.js';
import logger from '../utils/logger.js';
import { getActiveSeason } from '../services/season.service.js';

const { NETWORK_ID } = environments;
const MAX_RETRY = 3;

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
    logger.info('Token Transfer');
    logger.info({ from, to, value, event });
    const { transactionHash } = event;

    const batch = firestore.batch();

    const fromUserSnapshot = await firestore
      .collection('user')
      .where('address', '==', from.toLowerCase())
      .limit(1)
      .get();
    if (!fromUserSnapshot.empty) {
      const fromUserBalance = await contract.balanceOf(from);
      const fromUser = fromUserSnapshot.docs[0];
      const tokenBalance = Number(parseFloat(formatEther(fromUserBalance)).toFixed(6));
      batch.update(fromUser.ref, { tokenBalance });
    }

    if (from !== to) {
      const toUserSnapshot = await firestore.collection('user').where('address', '==', to.toLowerCase()).limit(1).get();
      if (!toUserSnapshot.empty) {
        const toUserBalance = await contract.balanceOf(to);
        const toUser = toUserSnapshot.docs[0];
        const tokenBalance = Number(parseFloat(formatEther(toUserBalance)).toFixed(6));
        batch.update(toUser.ref, { tokenBalance });
      }
    }

    let retry = 0;
    let isSuccess = false;
    while (retry < MAX_RETRY && !isSuccess) {
      try {
        logger.info(
          `Start processTransferEvent. Retry ${retry++} times. ${JSON.stringify({ from, to, value, event })}`
        );
        await batch.commit();
        isSuccess = true;
      } catch (err) {
        logger.error(`Unsuccessful processTransferEvent txn: ${JSON.stringify(err)}`);
      }
    }
  } catch (err) {
    logger.error(`Error in processTransferEvent, ${JSON.stringify(err)}`);
  }
};

export default tokenListener;
