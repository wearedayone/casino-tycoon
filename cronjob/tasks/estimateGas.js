import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import { parseEther } from '@ethersproject/units';
import { ethers } from 'ethers';
import { Utils } from 'alchemy-sdk';

import gameContractABI from '../assets/abis/GameContract.json' assert { type: 'json' };
import { firestore } from '../configs/admin.config.js';
import alchemy from '../configs/alchemy.config.js';
import environments from '../utils/environments.js';

const { SYSTEM_ADDRESS, WORKER_WALLET_PRIVATE_KEY, SIGNER_WALLET_PRIVATE_KEY } = environments;

const estimateGasPrice = async () => {
  try {
    console.log(`\n\n**************** Start job estimateGasPrice ****************\n`);
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
    console.log(`\n**************** End job estimateGasPrice ****************\n\n`);
  } catch (err) {
    console.error(err);
  }
};

export default estimateGasPrice;

// helpers
const getActiveSeason = async () => {
  const configs = await firestore.collection('system').doc('default').get();
  const { activeSeasonId } = configs.data();

  const snapshot = await firestore.collection('season').doc(activeSeasonId).get();

  return { id: snapshot.id, ...snapshot.data() };
};

const getGameContract = async (signer) => {
  const activeSeason = await getActiveSeason();
  const { gameAddress: GAME_CONTRACT_ADDRESS } = activeSeason || {};
  const contract = new Contract(GAME_CONTRACT_ADDRESS, gameContractABI.abi, signer);
  return contract;
};

const getWorkerWallet = async () => {
  const ethersProvider = await alchemy.config.getProvider();
  const workerWallet = new Wallet(WORKER_WALLET_PRIVATE_KEY, ethersProvider);
  return workerWallet;
};

const getSignerWallet = async () => {
  const ethersProvider = await alchemy.config.getProvider();
  const workerWallet = new Wallet(SIGNER_WALLET_PRIVATE_KEY, ethersProvider);
  return workerWallet;
};

const estimateTxnFee = async ({ functionName, params, value }) => {
  try {
    const workerWallet = await getWorkerWallet();
    const contract = await getGameContract(workerWallet);
    const ethersProvider = await alchemy.config.getProvider();
    const feeData = await ethersProvider.getFeeData();
    const lastBaseFeePerGas = Number(Utils.formatUnits(feeData.lastBaseFeePerGas, 'ether'));
    const maxPriorityFeePerGas = Number(Utils.formatUnits(feeData.maxPriorityFeePerGas, 'ether'));
    const gasPrice = lastBaseFeePerGas + maxPriorityFeePerGas; // based on real txns
    if (value) params.push({ value: BigInt(parseEther(value.toString()).toString()) });
    const estimatedGasCostInHex = await contract.estimateGas[functionName](...params);
    const gasLimit = Utils.formatUnits(estimatedGasCostInHex, 'wei');
    const transactionFee = gasPrice * gasLimit;

    // console.log({ gasPrice, gasLimit, transactionFee });
    console.log(`The gas cost estimation for the tx calling ${functionName} is: ${transactionFee} ether`);

    return transactionFee;
  } catch (error) {
    console.log(`Err in estimateTxnFee: ${error.error}`);
  }
};

const signMessageBuyGoon = async ({ address, amount, value, nonce }) => {
  const signerWallet = await getSignerWallet();
  let message = ethers.solidityPackedKeccak256(
    // Array of types: declares the data types in the message.
    ['address', 'uint256', 'uint256', 'uint256'],
    // Array of values: actual values of the parameters to be hashed.
    [address, amount, value.toString(), nonce]
  );

  const signature = await signerWallet.signMessage(ethers.toBeArray(message));
  return signature;
};

const signMessageBuyGangster = async ({ address, amount, nonce, bonus, referral }) => {
  const signerWallet = await getSignerWallet();

  // Array of types: declares the data types in the message.
  const types = ['address', 'uint256', 'uint256', 'uint256', 'uint256'];
  // Array of values: actual values of the parameters to be hashed.
  const values = [address, 1, amount, BigInt(parseEther(bonus.toString()).toString()), nonce];

  if (referral) {
    types.push('address');
    values.push(referral);
  }

  let message = ethers.solidityPackedKeccak256(types, values);

  const signature = await signerWallet.signMessage(ethers.toBeArray(message));
  return signature;
};
