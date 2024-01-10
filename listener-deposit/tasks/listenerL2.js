import { Contract } from '@ethersproject/contracts';

import depositLayerL2 from '../assets/abis/DepositLayerL2.json' assert { type: 'json' };
import { firestore } from '../configs/firebase.config.js';
import { alchemyLayer2 } from '../configs/alchemy.config.js';
import logger from '../utils/logger.js';
import { DepositEvent } from '../utils/constants.js';
import environments from '../utils/environments.js';

const { NETWORK_ID_LAYER_2, DEPOSIT_LAYER_2_ADDRESS } = environments;

const listenerL2 = async () => {
  logger.info(`Start listen contract ${DEPOSIT_LAYER_2_ADDRESS} on Network ${NETWORK_ID_LAYER_2}`);
  const ethersProvider = await alchemyLayer2.config.getWebSocketProvider();
  const contract = new Contract(DEPOSIT_LAYER_2_ADDRESS, depositLayerL2.abi, ethersProvider);

  contract.on(DepositEvent.DepositProposalApproved, async (receiver, amount, txnHashL1, event) => {
    console.log('DepositProposalApproved', { receiver, amount, txnHashL1 });
    await firestore.collection('depositWeb3Listener').doc(NETWORK_ID_LAYER_2).set({ lastBlock: event.blockNumber });
    await processDepositProposalApprovedEvent({ receiver, amount, txnHashL1, event, contract });
  });
};

export const queryEvent = async (fromBlock) => {
  const ethersProvider = await alchemyLayer2.config.getWebSocketProvider();
  const contract = new Contract(DEPOSIT_LAYER_2_ADDRESS, depositLayerL2.abi, ethersProvider);
  const depositEvents = await contract.queryFilter(DepositEvent.DepositProposalApproved, fromBlock);
  for (const event of depositEvents) {
    const [receiver, amount, txnHashL1] = event.args;
    await processDepositProposalApprovedEvent({ receiver, amount, txnHashL1, event, contract });
  }
};

const processDepositProposalApprovedEvent = async ({ receiver, amount, txnHashL1, event, contract }) => {
  try {
    logger.info('DepositProposalApprovedEvent');
    logger.info({ receiver, amount, event });
    const { transactionHash } = event;

    // update txn
    await approveTransaction({
      receiver: receiver.toLowerCase(),
      txnHashL1,
      txnHashL2: transactionHash,
    });
  } catch (err) {
    logger.error(err);
  }
};

const approveTransaction = async ({ receiver, txnHashL1, txnHashL2 }) => {
  console.log('approveTransaction', { receiver, txnHashL1, txnHashL2 });
  const userSnapshot = await firestore.collection('user').where('address', '==', receiver).limit(1).get();
  if (!userSnapshot.empty) {
    const transactionSnapshot = await firestore
      .collection('transaction')
      .where('userId', '==', userSnapshot.docs[0].id)
      .where('txnHashL1', '==', txnHashL1)
      .where('status', '==', 'Pending')
      .limit(1)
      .get();
    if (!transactionSnapshot.empty) {
      const doc = transactionSnapshot.docs[0];
      await doc.ref.update({
        txnHashL2,
        status: 'Success',
      });
    }
  }
};

export default listenerL2;
