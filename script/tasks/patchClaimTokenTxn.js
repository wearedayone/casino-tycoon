import * as ethers from 'ethers';
import { firestore } from '../configs/admin.config.js';
import alchemy from '../configs/alchemy.config.js';
import environments from '../utils/environments.js';
import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import tokenABI from '../assets/abis/Token.json' assert { type: 'json' };
import GangsterArenaABI from '../assets/abis/GameContract.json' assert { type: 'json' };
import { getActiveSeason } from '../utils/utils.js';
import { parseEther } from 'ethers/lib/utils.js';

const { WALLET_WORKER_PRIVATE_KEY, GAME_CONTRACT_ADDRESS } = environments;

const getWorkerWallet = async () => {
  const ethersProvider = await alchemy.config.getProvider();
  const workerWallet = new Wallet(WALLET_WORKER_PRIVATE_KEY, ethersProvider);
  return workerWallet;
};
const getTokenContract = async (signer) => {
  const activeSeason = await getActiveSeason();
  const { tokenAddress: TOKEN_ADDRESS } = activeSeason || {};
  const contract = new Contract(TOKEN_ADDRESS, tokenABI.abi, signer);
  return contract;
};

export const claimTokenTxn = async ({ address, amount }) => {
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
    console.log({ err });

    return { txnHash: txnHash || '', status: 'Failed' };
  }
};

const claimToken = async ({ transactionId, userId, value }) => {
  console.log(`claim for user ${userId} - ${value}`);
  //   if (userId != 'did:privy:clputhjki0056jx0f0tcz6uzc') return;
  const userSnapshot = await firestore.collection('user').doc(userId).get();
  if (userSnapshot.exists) {
    const { address } = userSnapshot.data();
    if (!!address) {
      console.log(`start claimToken`, parseEther(value.toString()));

      const { status, txnHash } = await claimTokenTxn({ address, amount: parseEther(value.toString()) });
      console.log(`update txn ${transactionId} - ${status} - ${txnHash}`);
      // update txn:
      await firestore.collection('transaction').doc(transactionId).update({
        status: status,
        txnHash: txnHash,
      });
    }
  }
};

const main = async () => {
  console.log(`start claimToken `);

  const transactionSnapshot = await firestore
    .collection('transaction')
    .where('type', '==', 'claim-token')
    .where('status', '==', 'Pending')
    .get();

  if (transactionSnapshot.empty) return;

  for (const transactionDoc of transactionSnapshot.docs) {
    const data = transactionDoc.data();
    await claimToken({ ...data, transactionId: transactionDoc.id });
  }
};

main()
  .then(process.exit)
  .catch((err) => console.error(err));
