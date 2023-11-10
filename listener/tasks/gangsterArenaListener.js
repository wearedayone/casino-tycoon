import { Contract } from '@ethersproject/contracts';
import { formatEther } from '@ethersproject/units';
import GangsterArenaABI from '../assets/abis/GangsterArena.json' assert { type: 'json' };
import admin, { firestore } from '../configs/firebase.config.js';
import alchemy from '../configs/alchemy.config.js';
import environments from '../utils/environments.js';
import logger from '../utils/logger.js';
import { GangsterEvent } from '../utils/constants.js';

const { GAME_CONTRACT_ADDRESS, NETWORK_ID } = environments;

const gangsterArenaListener = async () => {
  const ethersProvider = await alchemy.config.getWebSocketProvider();
  const contract = new Contract(GAME_CONTRACT_ADDRESS, GangsterArenaABI.abi, ethersProvider);

  contract.on(GangsterEvent.Mint, async (from, to, amount, event) => {
    await firestore.collection('web3Listener').doc(NETWORK_ID).update({ lastBlock: event.blockNumber });
    await processEvent({ from, to, amount, event, contract });
  });

  contract.on(GangsterEvent.Deposit, async (from, to, amount, event) => {
    await firestore.collection('web3Listener').doc(NETWORK_ID).update({ lastBlock: event.blockNumber });
    await processEvent({ from, to, amount, event, contract });
  });

  contract.on(GangsterEvent.Withdraw, async (from, to, amount, event) => {
    await firestore.collection('web3Listener').doc(NETWORK_ID).update({ lastBlock: event.blockNumber });
    await processEvent({ from, to, amount, event, contract });
  });

  contract.on(GangsterEvent.Burn, async (from, to, amount, event) => {
    await firestore.collection('web3Listener').doc(NETWORK_ID).update({ lastBlock: event.blockNumber });
    for (let i = 0; i < from.length(); i++) {
      await processEvent({ from: from[i], to: to[i], amount: amount[i], event, contract });
    }
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

const processEvent = async ({ from, to, amount, event, contract }) => {
  try {
    logger.info('NFT minted');
    logger.info({ from, to, amount, event });
    const { transactionHash } = event;

    const gangsterNumber = await contract.gangster(to);

    await updateNumberOfGangster({
      address: to.toLowerCase(),
      newBalance: parseFloat(formatEther(gangsterNumber)).toFixed(6),
    });
  } catch (err) {
    logger.error(err);
  }
};

const updateNumberOfGangster = async ({ address, newBalance }) => {
  logger.info({ address, newBalance: Number(newBalance) });
  const system = await firestore.collection('system').doc('default').get();
  const { activeSeasonId } = system.data();
  const user = await firestore.collection('user').where('address', '==', address).limit(1).get();
  if (!user.empty) {
    const gamePlay = await firestore
      .collection('gamePlay')
      .where('userId', '==', user.docs[0].id)
      .where('seasonId', '==', activeSeasonId)
      .limit(1)
      .get();
    if (!gamePlay.empty) {
      await firestore.collection('gamePlay').doc(gamePlay.id).update({
        numberOfMachines: newBalance,
      });
    }
  }
};

export default gangsterArenaListener;
