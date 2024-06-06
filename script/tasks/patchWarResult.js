import fs from 'fs';
import { firestore } from '../configs/admin.config.js';
import * as ethers from 'ethers';
import alchemy from '../configs/alchemy.config.js';
import environments from '../utils/environments.js';
import privy from '../configs/privy.config.js';
import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import { formatEther, parseEther } from '@ethersproject/units';
import { getParsedEthersError } from '@enzoferey/ethers-error-parser';

import tokenABI from '../assets/abis/Token.json' assert { type: 'json' };

const { WALLET_PRIVATE_KEY } = environments;

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

export const claimToken = async ({ address, amount }) => {
  let txnHash;
  try {
    console.log('start claimToken');
    console.log({ address, amount });
    const workerWallet = await getWorkerWallet();
    const tokenContract = await getTokenContract(workerWallet);
    console.log('start Transaction:');
    const tx = await tokenContract.mint(address, amount, { gasLimit: 200000 });
    console.log('Transaction:' + tx.hash);
    txnHash = tx.hash;
    const receipt = await tx.wait();

    if (receipt.status !== 1) {
      console.log(`error: ${JSON.stringify(receipt)}`);
      throw new Error(`error: ${JSON.stringify(receipt)}`);
    }

    return { txnHash, status: 'Success' };
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const getActiveSeasonId = async () => {
  const snapshot = await firestore.collection('system').doc('default').get();
  const configs = snapshot.data();

  return configs.activeSeasonId;
};

const getActiveSeason = async () => {
  const activeSeasonId = await getActiveSeasonId();
  const snapshot = await firestore.collection('season').doc(activeSeasonId).get();

  return { id: snapshot.id, ...snapshot.data() };
};

const main = async () => {
  const activeSeason = await getActiveSeason();
  const { id: activeSeasonId, machine, worker } = activeSeason;

  const snapshot = await firestore
    .collection('warSnapshot')
    .doc('20231208')
    .collection('warResult')
    .where('isWarEnabled', '==', true)
    .get();

  const users = [];
  for (const doc of snapshot.docs) {
    const { userId, bonus } = doc.data();
    // console.log({ userId, bonus });
    const userSnapshot = await firestore.collection('user').doc(userId).get();
    const { address, username } = userSnapshot.data();
    const userGamePlaySnapshot = await firestore
      .collection('gamePlay')
      .where('userId', '==', userId)
      .where('seasonId', '==', activeSeasonId)
      .get();
    const userGamePlay = { id: userGamePlaySnapshot.docs[0].id, ...userGamePlaySnapshot.docs[0].data() };
    const userDailyIncome =
      machine.dailyReward * userGamePlay.numberOfMachines + worker.dailyReward * userGamePlay.numberOfWorkers;
    if (bonus < userDailyIncome) {
      // if (username != 'huyhn310') continue;
      let resend = userDailyIncome;
      if (bonus > 0) resend = userDailyIncome - bonus;
      console.log({
        id: doc.id,
        userId,
        username,
        sent: bonus,
        userDailyIncome,
        resend: parseEther(resend.toString()),
        address,
      });

      await claimToken({ address, amount: parseEther(resend.toString()) });

      await firestore.collection('warSnapshot').doc('20231208').collection('warResult').doc(doc.id).update({
        bonus: userDailyIncome,
      });
    }
  }

  // fs.writeFileSync('./daily-war-2023-12-08.json', JSON.stringify(users), { encoding: 'utf-8' });
};
main();
