import { Contract } from '@ethersproject/contracts';
import { formatEther } from '@ethersproject/units';
import tokenABI from '../assets/abis/FIAT.json' assert { type: 'json' };
import admin, { firestore } from '../configs/firebase.config.js';
import alchemy from '../configs/alchemy.config.js';
import environments from '../utils/environments.js';
import logger from '../utils/logger.js';

const { TOKEN_ADDRESS, NETWORK_ID } = environments;

const tokenListener = async () => {
  const ethersProvider = await alchemy.config.getWebSocketProvider();
  const contract = new Contract(TOKEN_ADDRESS, tokenABI.abi, ethersProvider);

  contract.on('Transfer', async (from, to, value, event) => {
    await firestore.collection('web3Listener').doc(NETWORK_ID).update({ lastBlock: event.blockNumber });
    await processTransferEvent({ from, to, value, event, contract });
  });
};

export const queryEvent = async (fromBlock) => {
  const ethersProvider = await alchemy.config.getWebSocketProvider();
  const contract = new Contract(TOKEN_ADDRESS, tokenABI.abi, ethersProvider);
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
    const newBalanceFrom = await contract.balanceOf(from);
    await updateBalance({
      address: from.toLowerCase(),
      newBalance: parseFloat(formatEther(newBalanceFrom)).toFixed(6),
    });

    const newBalanceTo = await contract.balanceOf(to);

    await updateBalance({
      address: to.toLowerCase(),
      newBalance: parseFloat(formatEther(newBalanceTo)).toFixed(6),
    });
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

export default tokenListener;
