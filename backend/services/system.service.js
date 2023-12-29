import { formatEther, parseEther } from '@ethersproject/units';

import { firestore } from '../configs/firebase.config.js';
import environments from '../utils/environments.js';
import { calculateNextBuildingBuyPriceBatch, calculateNextWorkerBuyPriceBatch } from '../utils/formulas.js';
import { getActiveSeason } from './season.service.js';
import { estimateTxnFee, signMessageBuyGoon } from './worker.service.js';

const { SYSTEM_ADDRESS } = environments;

export const updateEstimatedGasPrice = async () => {
  const estimatedGasRef = firestore.collection('system').doc('estimated-gas');
  const systemData = await firestore.collection('system').doc('data').get();
  const { nonce } = systemData.data();

  const { machine } = await getActiveSeason();

  // amount = 0 since worker wallet has no fiat balance -> contract throws err if amount > 0
  const fiatBuyValue = parseEther('0');

  const workerSignature = await signMessageBuyGoon({
    address: SYSTEM_ADDRESS,
    amount: 0,
    value: fiatBuyValue,
    nonce,
  });
  const buildingSignature = await signMessageBuyGoon({
    address: SYSTEM_ADDRESS,
    amount: 0,
    value: fiatBuyValue,
    nonce,
  });

  const [mint, buyGoon, buySafeHouse] = await Promise.all([
    estimateTxnFee({ functionName: 'mint', params: [1, 1], value: machine.basePrice }),
    estimateTxnFee({
      functionName: 'buyGoon',
      params: [0, BigInt(fiatBuyValue.toString()), nonce, workerSignature],
    }),
    estimateTxnFee({
      functionName: 'buySafeHouse',
      params: [0, BigInt(fiatBuyValue.toString()), nonce, buildingSignature],
    }),
  ]);

  const updatedGas = {};

  if (!isNaN(mint)) updatedGas.mint = mint;
  if (!isNaN(buyGoon)) updatedGas.buyGoon = buyGoon;
  if (!isNaN(buySafeHouse)) updatedGas.buySafeHouse = buySafeHouse;

  const { game } = (await estimatedGasRef.get()).data();

  await firestore
    .collection('system')
    .doc('estimated-gas')
    .update({
      game: {
        ...game,
        ...updatedGas,
      },
    });
};
