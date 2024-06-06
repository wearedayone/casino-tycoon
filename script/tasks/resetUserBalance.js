import { firestore } from '../configs/admin.config.js';

import { Contract } from '@ethersproject/contracts';
import * as ethers from 'ethers';
import alchemy from '../configs/alchemy.config.js';
import tokenABI from '../assets/abis/Token.json' assert { type: 'json' };
import nftABI from '../assets/abis/NFT.json' assert { type: 'json' };

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

const getTokenContract = async () => {
  const provider = await alchemy.config.getProvider();
  const activeSeason = await getActiveSeason();
  const { tokenAddress: TOKEN_ADDRESS } = activeSeason || {};
  const contract = new Contract(TOKEN_ADDRESS, tokenABI.abi, provider);
  return contract;
};

const getNFTContract = async () => {
  const provider = await alchemy.config.getProvider();
  const activeSeason = await getActiveSeason();
  const { nftAddress: NFT_ADDRESS } = activeSeason || {};
  const contract = new Contract(NFT_ADDRESS, nftABI.abi, provider);
  return contract;
};

const main = async () => {
  while (true) {
    const contract = await getTokenContract();
    const nftContract = await getNFTContract();
    const userSnapshot = await firestore.collection('user').get();

    for (const doc of userSnapshot.docs) {
      const { address, tokenBalance } = doc.data();
      console.log({ address });
      const balance = await contract.balanceOf(address);
      const newBalance = ethers.utils.formatEther(balance.toString());
      if (newBalance - tokenBalance > 1 || newBalance - tokenBalance < -1) {
        console.log(`${address}: ${tokenBalance} ${newBalance}`);
        await doc.ref.update({ tokenBalance: newBalance });
      }
      const nftBalance = await nftContract.gangster(address);
      const gp = await firestore
        .collection('gamePlay')
        .where('userId', '==', doc.id)
        .where('seasonId', '==', 'ZteHVCoKgpnMvg1tHTfj')
        .limit(1)
        .get();
      if (gp.empty) continue;
      const { numberOfMachines } = gp.docs[0].data();
      const newNftBalance = ethers.utils.formatEther(nftBalance.toString());
      if (newNftBalance != numberOfMachines) {
        console.log(`${address}: ${nftBalance} ${numberOfMachines}`);
        // await firestore.collection('gamePlay').doc(gp.docs[0].id).update({ numberOfMachines: nftBalance });
      }
    }
  }
};

// const main = async () => {
//   const userSnapshot = await firestore.collection('user').get();

//   userSnapshot.docs.map(async (doc, index) => {
//     await doc.ref.update({ completedTutorial: false });
//   });
// };

main()
  .then(() => console.log('done'))
  .catch((err) => console.error(err));
