import { getActiveSeason } from '../utils/utils.js';
import admin, { firestore } from '../configs/admin.config.js';
import alchemy from '../configs/alchemy.config.js';
import environments from '../utils/environments.js';
import { Contract } from '@ethersproject/contracts';
import GangsterArenaABI from '../assets/abis/GameContract.json' assert { type: 'json' };

const { GAME_CONTRACT_ADDRESS } = environments;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const main = async () => {
  try {
    console.log('Start patching transaction');
    const userSnapshot = await firestore.collection('transaction').get();
    if (!userSnapshot.empty) {
      for (let i = 0; i < userSnapshot.docs.length; i++) {
        if (i % 100 == 0) await sleep(5000);
        console.log('patching data number: ' + i);
        await firestore.collection('transaction').doc(userSnapshot.docs[i].id).update({ isMigrate: true });
      }
    }
  } catch (err) {
    console.log({ err });
  }
};
main();
