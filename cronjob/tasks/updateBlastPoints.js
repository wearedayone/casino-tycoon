import axios from 'axios';
import { Wallet } from '@ethersproject/wallet';

import admin, { firestore } from '../configs/admin.config.js';
import { getActiveSeason } from '../../script/utils/utils.js';
import quickNode from '../configs/quicknode.config.js';
import environments from '../utils/environments.js';

const { BLAST_OPERATOR_ADDRESS, BLAST_OPERATOR_PRIVATE_KEY, BLAST_API_URL } = environments;

const api = axios.create({
  baseURL: BLAST_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const MAX_RETRY = 3;

const getGameBlastPointBalance = async () => {
  const activeSeason = await getActiveSeason();
  const { gameAddress } = activeSeason;

  // obtain a challenge
  const res1 = await api.post('/dapp-auth/challenge', {
    contractAddress: gameAddress,
    operatorAddress: BLAST_OPERATOR_ADDRESS,
  });

  const { challengeData, message } = res1.data;

  const operatorWallet = new Wallet(BLAST_OPERATOR_PRIVATE_KEY, quickNode);
  const signature = await operatorWallet.signMessage(message);
  const res2 = await api.post('/dapp-auth/solve', { challengeData, signature });

  const { bearerToken } = res2.data;

  const res3 = await api.get(`/contracts/${gameAddress}/point-balances`, {
    headers: { Authorization: `Bearer ${bearerToken}` },
  });

  const { balancesByPointType } = res3.data;
  const points = {
    liquidity: balancesByPointType?.LIQUIDITY?.available,
    developer: balancesByPointType?.DEVELOPER?.available,
  };

  // TODO: if we need to distribute GOLD to users???
  return Number(points.liquidity);
};

const updateBlastPoints = async () => {
  try {
    const activeSeason = await getActiveSeason();
    const { id: activeSeasonId, blastPointBalance } = activeSeason;

    const newBlastPointBalance = await getGameBlastPointBalance();
    // const newBlastPointBalance = 10000;
    if (!newBlastPointBalance || newBlastPointBalance === blastPointBalance) return;

    const gamePlaySnapshot = await firestore.collection('gamePlay').where('seasonId', '==', activeSeasonId).get();
    const totalNetworths = gamePlaySnapshot.docs.reduce((total, item) => total + item.data().networth, 0);
    // console.log('Total networths', totalNetworths);

    const batch = firestore.batch();
    for (const gamePlay of gamePlaySnapshot.docs) {
      const { networth } = gamePlay.data();
      const newBlastPointReward = newBlastPointBalance * (networth / totalNetworths);
      // console.log(`Gameplay ${gamePlay.id}: ${newBlastPointReward}`);
      const gamePlayRef = firestore.collection('gamePlay').doc(gamePlay.id);
      batch.update(gamePlayRef, {
        blastPointReward: admin.firestore.FieldValue.increment(newBlastPointReward),
      });
    }

    let retry = 0;
    let isSuccess = false;
    while (retry < MAX_RETRY && !isSuccess) {
      try {
        console.log(`Start updating blastPointReward. Retry ${retry++} times.`);
        await batch.commit();
        isSuccess = true;
      } catch (err) {
        console.error(`Unsuccessful updating blastPointReward: ${JSON.stringify(err)}`);
      }
    }

    if (!isSuccess) {
      throw new Error('API error: Error when updating blastPointReward');
    }
  } catch (err) {
    console.log('Error updateBlastPoints', err);
  }
};

export default updateBlastPoints;

// updateBlastPoints().then(() => console.log('OK!'));
