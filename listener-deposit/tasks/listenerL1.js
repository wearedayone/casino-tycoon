import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import { formatEther } from '@ethersproject/units';
import moment from 'moment';

import depositLayerL1 from '../assets/abis/DepositLayerL1.json' assert { type: 'json' };
import depositLayerL2 from '../assets/abis/DepositLayerL2.json' assert { type: 'json' };
import admin, { firestore } from '../configs/firebase.config.js';
import { alchemyLayer1, alchemyLayer2 } from '../configs/alchemy.config.js';
import logger from '../utils/logger.js';
import { DepositEvent } from '../utils/constants.js';
import environments from '../utils/environments.js';

const {
  NETWORK_ID_LAYER_1,
  DEPOSIT_LAYER_1_ADDRESS,
  DEPOSIT_LAYER_2_ADDRESS,
  DEPOSIT_SYSTEM_WALLET_PRIVATE_KEY,
  ADMIN_EMAIL,
  EMAIL_NOTIFICATION_RECEIVER,
} = environments;

const listenerL1 = async () => {
  logger.info(`Start listen contract ${DEPOSIT_LAYER_1_ADDRESS} on Network ${NETWORK_ID_LAYER_1}`);
  const ethersProvider = await alchemyLayer1.config.getWebSocketProvider();
  const contract = new Contract(DEPOSIT_LAYER_1_ADDRESS, depositLayerL1.abi, ethersProvider);

  contract.on(DepositEvent.DepositProposalCreated, async (receiver, amount, event) => {
    console.log('DepositProposalCreated', { receiver, amount });
    await firestore.collection('depositWeb3Listener').doc(NETWORK_ID_LAYER_1).set({ lastBlock: event.blockNumber });
    await processDepositProposalCreatedEvent({ receiver, amount, event, contract });
  });
};

export const queryEvent = async (fromBlock) => {
  const ethersProvider = await alchemyLayer1.config.getWebSocketProvider();
  const contract = new Contract(DEPOSIT_LAYER_1_ADDRESS, depositLayerL1.abi, ethersProvider);
  const depositEvents = await contract.queryFilter(DepositEvent.DepositProposalCreated, fromBlock);
  for (const event of depositEvents) {
    const [receiver, amount] = event.args;
    await processDepositProposalCreatedEvent({ receiver, amount, event, contract });
  }
};

const processDepositProposalCreatedEvent = async ({ receiver, amount, event, contract }) => {
  try {
    logger.info('DepositProposalCreatedEvent');
    logger.info({ receiver, amount, event });
    const { transactionHash } = event;

    // create txn doc
    await createTransaction({
      address: receiver.toLowerCase(),
      type: 'L1-deposit',
      txnHashL1: transactionHash,
      token: 'ETH',
      amount: Number(amount.toString()),
      status: 'Pending',
      value: 0,
    });

    // call function in layer2 sc
    await sendETHToUserWalletLayer2({ receiver, amount, txnHashL1: transactionHash });
  } catch (err) {
    logger.error(err);
  }
};

const createTransaction = async ({ address, ...data }) => {
  const system = await firestore.collection('system').doc('default').get();
  const { activeSeasonId } = system.data();

  const userSnapshot = await firestore.collection('user').where('address', '==', address).limit(1).get();
  if (!userSnapshot.empty) {
    await firestore.collection('transaction').add({
      userId: userSnapshot.docs[0].id,
      seasonId: activeSeasonId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ...data,
    });
  }
};

const sendETHToUserWalletLayer2 = async ({ receiver, amount, txnHashL1 }) => {
  const depositSystemWallet = await getDepositSystemWallet();
  const depositLayerL2Contract = new Contract(DEPOSIT_LAYER_2_ADDRESS, depositLayerL2.abi, depositSystemWallet);

  const tx = await depositLayerL2Contract.approveDepositProposal(receiver, txnHashL1, { value: amount });
  const receipt = await tx.wait();
  console.log('receipt', receipt.status, receipt);
  if (receipt.status !== 1) {
    const userSnapshot = await firestore
      .collection('user')
      .where('address', '==', receiver.toLowerCase())
      .limit(1)
      .get();
    if (userSnapshot.empty) return;

    const transactionSnapshot = await firestore
      .collection('transaction')
      .where('userId', '==', userSnapshot.docs[0].id)
      .where('txnHashL1', '==', txnHashL1)
      .limit(1)
      .get();

    if (!transactionSnapshot.empty) {
      const doc = transactionSnapshot.docs[0];
      await doc.ref.update({
        txnHashL2: tx.hash,
        status: 'Failed',
      });

      await admin
        .firestore()
        .collection('email')
        .add({
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'Pending',
          from: `GangsterArena <${ADMIN_EMAIL}>`,
          to: EMAIL_NOTIFICATION_RECEIVER,
          subject: 'Deposit bridge error',
          template: 'deposit-error',
          variables: {
            userId: userSnapshot.docs[0].id,
            username: userSnapshot.docs[0].data().username,
            amount: formatEther(amount),
            txnHashL1,
            txnHashL2: tx.hash,
            createdAt: moment(doc.data().createdAt.toDate()).format('DD/MM/YYYY HH:mm:ss'),
            receipt: JSON.stringify(receipt),
          },
        });
    }
  }
};

const getDepositSystemWallet = async () => {
  const ethersProvider = await alchemyLayer2.config.getProvider();
  const wallet = new Wallet(DEPOSIT_SYSTEM_WALLET_PRIVATE_KEY, ethersProvider);
  return wallet;
};

export default listenerL1;
