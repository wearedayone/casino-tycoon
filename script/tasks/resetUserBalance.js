import { firestore } from '../configs/admin.config.js';

import { Contract } from '@ethersproject/contracts';
import * as ethers from 'ethers';
import alchemy, { getCustomAlchemy } from '../configs/alchemy.config.js';
import tokenABI from '../assets/abis/Token.json' assert { type: 'json' };
import nftABI from '../assets/abis/NFT.json' assert { type: 'json' };

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

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

const getTokenContract = async (alchemyKey) => {
  const provider = alchemyKey
    ? await getCustomAlchemy(alchemyKey).config.getProvider()
    : await alchemy.config.getProvider();
  const activeSeason = await getActiveSeason();
  const { tokenAddress: TOKEN_ADDRESS } = activeSeason || {};
  const contract = new Contract(TOKEN_ADDRESS, tokenABI.abi, provider);
  return contract;
};

const getNFTContract = async (alchemyKey) => {
  const provider = alchemyKey
    ? await getCustomAlchemy(alchemyKey).config.getProvider()
    : await alchemy.config.getProvider();
  const activeSeason = await getActiveSeason();
  const { nftAddress: NFT_ADDRESS } = activeSeason || {};
  const contract = new Contract(NFT_ADDRESS, nftABI.abi, provider);
  return contract;
};

const UpdateBalance = async ({ alchemyKey, token, nft }) => {
  console.log({ alchemyKey, token, nft });
  while (true) {
    const contract = await getTokenContract(alchemyKey);
    const nftContract = await getNFTContract(alchemyKey);
    const userSnapshot = await firestore.collection('user').get();
    const gp = await firestore
      .collection('gamePlay')
      .where('active', '==', true)
      .where('seasonId', '==', 'ZteHVCoKgpnMvg1tHTfj')
      .get();
    if (gp.empty || userSnapshot.empty) {
      await sleep(5000);
      continue;
    }
    const listIds = gp.docs.map((doc) => doc.data().userId);

    const totalUserData = userSnapshot.docs
      .map((doc) => ({ userId: doc.id, ...doc.data() }))
      .filter((u) => listIds.includes(u.userId));
    if (totalUserData.length == 0) {
      await sleep(5000);
      continue;
    }
    // console.log(new Date().toLocaleString(), totalUserData.length);
    let i = 0;
    const count = 30;

    while (i < totalUserData.length) {
      const userDatas = totalUserData.slice(i, i + count);
      if (token == 'true') {
        await updateTokenBalance({ userDatas, tokenContract: contract });
        await sleep(200);
      }
      if (nft == 'true') {
        await updateNFTnBalance({ userDatas, nftContract: nftContract });
        await sleep(200);
      }
      i = i + count;
    }
  }
};

const updateTokenBalance = async ({ userDatas, tokenContract }) => {
  const promises = userDatas.map(async (userData) => {
    try {
      const { address, tokenBalance } = userData;
      // console.log(`${address}: Update FIAT Balance`);
      const balance = await tokenContract.balanceOf(address);
      const newBalance = ethers.utils.formatEther(balance.toString());
      if (newBalance - tokenBalance > 1 || newBalance - tokenBalance < -1) {
        const latestUser = await firestore.collection('user').doc(userData.userId).get();
        const { tokenBalance: currentBalance } = latestUser.data();
        if (newBalance - currentBalance > 1 || newBalance - currentBalance < -1) {
          console.log(new Date().toLocaleString(), `${address}: FIAT: ${currentBalance} ${newBalance}`);
          await firestore.collection('user').doc(userData.userId).update({ tokenBalance: newBalance });
        }
      }
    } catch (ex) {
      console.log('Exception');
    }
  });
  await Promise.all(promises);
};

const updateNFTnBalance = async ({ userDatas, nftContract }) => {
  const promises = userDatas.map(async (userData) => {
    try {
      const { address } = userData;
      const nftBalance = await nftContract.gangster(address);
      const gp = await firestore
        .collection('gamePlay')
        .where('userId', '==', userData.userId)
        .where('seasonId', '==', 'ZteHVCoKgpnMvg1tHTfj')
        .limit(1)
        .get();
      if (gp.empty) return;
      const { numberOfMachines } = gp.docs[0].data();
      const newNftBalance = ethers.utils.formatEther(nftBalance.toString());
      const newNftBalanceNumber = Math.round(Number(newNftBalance) * 1e18);
      if (newNftBalanceNumber != numberOfMachines) {
        console.log(`${address}:  NFT: ${newNftBalanceNumber} ${Number(numberOfMachines)}`);
        await firestore.collection('gamePlay').doc(gp.docs[0].id).update({ numberOfMachines: newNftBalanceNumber });
      }
    } catch (ex) {
      console.log({ ex });
    }
  });
  await Promise.all(promises);
};
const main = async () => {
  const args = process.argv;

  await UpdateBalance({ token: args[2], nft: args[3], alchemyKey: args[4] });
};

main()
  .then(() => console.log('done'))
  .catch((err) => console.error(err));
