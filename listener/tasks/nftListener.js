import { Contract } from '@ethersproject/contracts';
import { formatEther } from '@ethersproject/units';
import gangsterABI from '../assets/abis/Gangster.json' assert { type: 'json' };
import admin, { firestore } from '../configs/firebase.config.js';
import alchemy from '../configs/alchemy.config.js';
import environments from '../utils/environments.js';
import logger from '../utils/logger.js';
import { GangsterEvent } from '../utils/constants.js';
import { getActiveSeason } from '../services/season.service.js';

const { NETWORK_ID } = environments;

const nftListener = async () => {
  const activeSeason = await getActiveSeason();
  const { gameAddress: GAME_CONTRACT_ADDRESS } = activeSeason || {};

  const ethersProvider = await alchemy.config.getWebSocketProvider();
  const contract = new Contract(GAME_CONTRACT_ADDRESS, gangsterABI.abi, ethersProvider);

  contract.on(GangsterEvent.Mint, async (from, to, amount, event) => {
    await firestore.collection('web3Listener').doc(NETWORK_ID).update({ lastBlock: event.blockNumber });
    await processMintEvent({ from, to, amount, event, contract });
  });

  contract.on(GangsterEvent.Deposit, async (from, to, amount, event) => {
    await firestore.collection('web3Listener').doc(NETWORK_ID).update({ lastBlock: event.blockNumber });
    await processTransferEvent({ from, to, amount, event, contract });
  });

  contract.on(GangsterEvent.Withdraw, async (from, to, amount, event) => {
    await firestore.collection('web3Listener').doc(NETWORK_ID).update({ lastBlock: event.blockNumber });
    await processTransferEvent({ from, to, amount, event, contract });
  });

  contract.on(GangsterEvent.Burn, async (from, to, amount, event) => {
    await firestore.collection('web3Listener').doc(NETWORK_ID).update({ lastBlock: event.blockNumber });
    await processTransferEvent({ from, to, amount, event, contract });
  });
};

// export const queryEvent = async (fromBlock) => {
//   const ethersProvider = await alchemy.config.getWebSocketProvider();
//   const contract = new Contract(TOKEN_ADDRESS, tokenABI.abi, ethersProvider);
//   const depositEvents = await contract.queryFilter('Transfer', fromBlock);
//   for (const event of depositEvents) {
//     const [from, to, value] = event.args;
//     // console.log({ wallet, amount });
//     await processTransferEvent({ from, to, value, event, contract });
//   }
// };

const processMintEvent = async ({ from, to, amount, event, contract }) => {
  try {
    logger.info('NFT minted');
    logger.info({ from, to, amount, event });
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
  await firestore.collection('user').doc(userId).update({
    tokenBalance: newBalance,
  });
};

export default nftListener;
