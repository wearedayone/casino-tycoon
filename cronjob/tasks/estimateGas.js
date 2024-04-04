import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import { parseEther, formatEther, formatUnits } from '@ethersproject/units';
import { ethers } from 'ethers';
import RouterABI from '@uniswap/v2-periphery/build/IUniswapV2Router02.json' assert { type: 'json' };

import gameContractABI from '../assets/abis/GameContract.json' assert { type: 'json' };
import { firestore } from '../configs/admin.config.js';
import quickNode from '../configs/quicknode.config.js';
import environments from '../utils/environments.js';

const { SIGNER_ADDRESS, SIGNER_WALLET_PRIVATE_KEY } = environments;

const estimateGasPrice = async () => {
  try {
    console.log(`\n\n**************** Start job estimateGasPrice ****************\n`);
    const estimatedGasRef = firestore.collection('system').doc('estimated-gas');
    const systemData = await firestore.collection('system').doc('data').get();
    const { nonce } = systemData.data();

    const { tokenAddress, wethAddress } = await getActiveSeason();

    // amount = 0 since worker wallet has no fiat balance -> contract throws err if amount > 0
    const fiatBuyValue = parseEther('0');

    const time = Math.floor(Date.now() / 1000);
    const deadline = time + 10 * 60;

    const amount = 0;
    const referrerAddress = '0xb5987682d601354eA1e8620253191Fb4e43024e6';
    const machineSignature = await signMessageBuyGangster({
      address: SIGNER_ADDRESS,
      amount: 1,
      value: 0,
      time,
      nGangster: 0,
      nonce: nonce + 1,
      bType: 1,
      referral: referrerAddress,
    });
    const workerSignature = await signMessageBuyGoon({
      address: SIGNER_ADDRESS,
      amount,
      value: fiatBuyValue,
      totalAmount: 0,
      time,
      nonce: nonce + 1,
      mintFunction: 'buyGoon',
    });
    const buildingSignature = await signMessageBuyGoon({
      address: SIGNER_ADDRESS,
      amount,
      value: fiatBuyValue,
      totalAmount: 0,
      time,
      nonce: nonce + 1,
      mintFunction: 'buySafeHouse',
    });

    const [buyGangster, buyGoon, buySafeHouse, swapEthToFiat] = await Promise.all([
      estimateTxnFee({
        functionName: 'buyGangster',
        params: [1, 1, 0, time, 0, nonce + 1, 1, referrerAddress, machineSignature],
      }),
      estimateTxnFee({
        functionName: 'buyGoon',
        params: [amount, BigInt(fiatBuyValue.toString()), 0, time, nonce + 1, workerSignature],
      }),
      estimateTxnFee({
        functionName: 'buySafeHouse',
        params: [amount, BigInt(fiatBuyValue.toString()), 0, time, nonce + 1, buildingSignature],
      }),
      estimateTxnFee({
        functionName: 'swapExactETHForTokensSupportingFeeOnTransferTokens',
        params: [0, [wethAddress, tokenAddress], SIGNER_ADDRESS, deadline],
        value: 0.001, // small amount to get gas only
        getContractFnc: getRouterContract,
      }),
    ]);

    const updatedGameGas = {};
    const updatedSwapGas = {};

    if (!isNaN(buyGangster)) updatedGameGas.buyGangster = buyGangster;
    if (!isNaN(buyGoon)) updatedGameGas.buyGoon = buyGoon;
    if (!isNaN(buySafeHouse)) updatedGameGas.buySafeHouse = buySafeHouse;
    if (!isNaN(swapEthToFiat)) updatedSwapGas.swapEthToToken = swapEthToFiat;

    const { game, swap } = (await estimatedGasRef.get()).data();

    await firestore
      .collection('system')
      .doc('estimated-gas')
      .update({
        game: {
          ...game,
          ...updatedGameGas,
        },
        swap: {
          ...swap,
          ...updatedSwapGas,
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

const getRouterContract = async (signer) => {
  const activeSeason = await getActiveSeason();

  const { routerAddress } = activeSeason || {};
  const routerContract = new Contract(routerAddress, RouterABI.abi, signer);

  return routerContract;
};

const getSignerWallet = async () => {
  const signerWallet = new Wallet(SIGNER_WALLET_PRIVATE_KEY, quickNode);
  return signerWallet;
};

const estimateTxnFee = async ({ functionName, params, value, getContractFnc = getGameContract }) => {
  try {
    const signerWallet = await getSignerWallet();
    const contract = await getContractFnc(signerWallet);
    const feeData = await quickNode.getFeeData();
    const lastBaseFeePerGas = Number(formatEther(feeData.lastBaseFeePerGas));
    const maxPriorityFeePerGas = Number(formatEther(feeData.maxPriorityFeePerGas));
    const gasPrice = lastBaseFeePerGas + maxPriorityFeePerGas; // based on real txns
    if (value) params.push({ value: BigInt(parseEther(value.toString()).toString()) });
    const estimatedGasCostInHex = await contract.estimateGas[functionName](...params);
    const gasLimit = Number(formatUnits(estimatedGasCostInHex, 'wei'));
    const transactionFee = gasPrice * gasLimit;

    // console.log({ gasPrice, gasLimit, transactionFee });
    console.log(`The gas cost estimation for the tx calling ${functionName} is: ${transactionFee} ether\n`);

    return transactionFee;
  } catch (error) {
    console.log(`Err estimate gas for ${functionName}: ${error.error || error.message}`);
  }
};

export const signMessageBuyGoon = async ({ address, amount, value, totalAmount, time, nonce, mintFunction }) => {
  const signerWallet = await getSignerWallet();
  let message = ethers.solidityPackedKeccak256(
    // Array of types: declares the data types in the message.
    ['address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'string'],
    // Array of values: actual values of the parameters to be hashed.
    [address, amount, value.toString(), totalAmount, time, nonce, mintFunction]
  );

  const signature = await signerWallet.signMessage(ethers.toBeArray(message));
  return signature;
};

export const signMessageBuyGangster = async ({ address, amount, value, time, nGangster, nonce, bType, referral }) => {
  const signerWallet = await getSignerWallet();

  // Array of types: declares the data types in the message.
  const types = ['address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'address'];
  // Array of values: actual values of the parameters to be hashed.
  const values = [address, 1, amount, value, time, nGangster, nonce, bType, referral];

  let message = ethers.solidityPackedKeccak256(types, values);

  const signature = await signerWallet.signMessage(ethers.toBeArray(message));
  return signature;
};
