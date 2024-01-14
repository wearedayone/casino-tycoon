import { parseEther } from '@ethersproject/units';

import { firestore } from '../configs/firebase.config.js';
import environments from '../utils/environments.js';
import { getActiveSeason } from './season.service.js';
import { estimateTxnFee, signMessageBuyGangster, signMessageBuyGoon } from './worker.service.js';

const { SYSTEM_ADDRESS } = environments;

export const updateEstimatedGasPrice = async () => {
  const estimatedGasRef = firestore.collection('system').doc('estimated-gas');
  const systemData = await firestore.collection('system').doc('data').get();
  const { nonce } = systemData.data();

  const { machine } = await getActiveSeason();

  // amount = 0 since worker wallet has no fiat balance -> contract throws err if amount > 0
  const fiatBuyValue = parseEther('0');

  const machineSignature = await signMessageBuyGangster({
    address: SYSTEM_ADDRESS,
    amount: 1,
    nonce,
    bonus: 0,
  });
  const workerOrBuildingSignature = await signMessageBuyGoon({
    address: SYSTEM_ADDRESS,
    amount: 0,
    value: fiatBuyValue,
    nonce,
  });
  const buyWorkerOrBuildingParams = [0, BigInt(fiatBuyValue.toString()), nonce, workerOrBuildingSignature];

  const [mint, buyGoon, buySafeHouse] = await Promise.all([
    estimateTxnFee({ functionName: 'mint', params: [1, 1, 0, nonce, machineSignature], value: machine.basePrice }),
    estimateTxnFee({ functionName: 'buyGoon', params: buyWorkerOrBuildingParams }),
    estimateTxnFee({ functionName: 'buySafeHouse', params: buyWorkerOrBuildingParams }),
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

updateEstimatedGasPrice();
