import { Wallet } from '@ethersproject/wallet';
import { ethers } from 'ethers';

import { firestore } from '../configs/firebase.config.js';
import quickNode from '../configs/quicknode.config.js';
import { isWhitelisted } from './user.service.js';
import environments from '../utils/environments.js';

const { SIGNER_WALLET_PRIVATE_KEY } = environments;

const getSignerWallet = async () => {
  const signerWallet = new Wallet(SIGNER_WALLET_PRIVATE_KEY, quickNode);
  return signerWallet;
};

const signMessageMint = async ({ address, phaseId, amount }) => {
  const signerWallet = await getSignerWallet();

  const types = ['address', 'uint256', 'uint256'];
  const values = [address, phaseId, amount];

  const message = ethers.solidityPackedKeccak256(types, values);

  const signature = await signerWallet.signMessage(ethers.toBeArray(message));
  return signature;
};

export const getSignatureMint = async ({ address, phaseId, amount }) => {
  const phase = await firestore.collection('phase').doc(`${phaseId}`).get();
  if (!phase.exists) throw new Error('API error: Not found phase');

  const { startTime, startTimeForWhitelisted, endTime, maxPerWallet, totalSupply, sold, type, priceInEth } =
    phase.data();

  const isWhitelistedUser = await isWhitelisted(address, phaseId);
  let phaseStartTime = isWhitelistedUser && type === 'hybrid' ? startTimeForWhitelisted : startTime;

  const now = Date.now();
  if (now < phaseStartTime.toDate().getTime()) throw new Error('API error: Phase hasnt started yet');
  if (now > endTime.toDate().getTime()) throw new Error('API error: Phase has ended already');

  if (sold + amount > totalSupply) throw new Error('API error: Over supply limit');

  const user = await firestore.collection('user').doc(address).get();
  const { mintedPhases } = user.data();
  const mintedAmount = mintedPhases?.[phaseId] || 0;
  if (mintedAmount + amount > maxPerWallet) throw new Error('API error: Over limit per wallet');

  if (type === 'whitelisted') {
    if (!isWhitelistedUser) throw new Error('API error: Bad credential');
  }

  const signature = await signMessageMint({ address, phaseId, amount });
  return { signature, value: Math.floor(amount * priceInEth * 10000) / 10000, phaseId, amount };
};
