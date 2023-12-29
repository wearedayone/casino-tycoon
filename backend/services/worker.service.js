import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import { ethers } from 'ethers';
import { getParsedEthersError } from '@enzoferey/ethers-error-parser';
import { Utils } from 'alchemy-sdk';

import tokenABI from '../assets/abis/Token.json' assert { type: 'json' };
import gameContractABI from '../assets/abis/GameContract.json' assert { type: 'json' };
import environments from '../utils/environments.js';
import alchemy from '../configs/alchemy.config.js';
import logger from '../utils/logger.js';
import { getActiveSeason } from './season.service.js';

const { WORKER_WALLET_PRIVATE_KEY } = environments;

const getWorkerWallet = async () => {
  const ethersProvider = await alchemy.config.getProvider();
  const workerWallet = new Wallet(WORKER_WALLET_PRIVATE_KEY, ethersProvider);
  return workerWallet;
};

const getTokenContract = async (signer) => {
  const activeSeason = await getActiveSeason();
  const { tokenAddress: TOKEN_ADDRESS } = activeSeason || {};
  const contract = new Contract(TOKEN_ADDRESS, tokenABI.abi, signer);
  return contract;
};

const getGameContract = async (signer) => {
  const activeSeason = await getActiveSeason();
  const { gameAddress: GAME_CONTRACT_ADDRESS } = activeSeason || {};
  const contract = new Contract(GAME_CONTRACT_ADDRESS, gameContractABI.abi, signer);
  return contract;
};

const getContractMap = {
  game: getGameContract,
  token: getTokenContract,
};
export const estimateTxnFee = async ({ contractName = 'game', functionName, params, value }) => {
  try {
    const workerWallet = await getWorkerWallet();
    const contract = await getContractMap[contractName](workerWallet);
    const ethersProvider = await alchemy.config.getProvider();
    const feeData = await ethersProvider.getFeeData();
    const lastBaseFeePerGas = Number(Utils.formatUnits(feeData.lastBaseFeePerGas, 'ether'));
    const maxPriorityFeePerGas = Number(Utils.formatUnits(feeData.maxPriorityFeePerGas, 'ether'));
    const gasPrice = lastBaseFeePerGas + maxPriorityFeePerGas; // based on real txns
    if (value) params.push({ value: BigInt(Math.ceil(value * 1e18)) });
    const estimatedGasCostInHex = await contract.estimateGas[functionName](...params);
    const gasLimit = Utils.formatUnits(estimatedGasCostInHex, 'wei');
    const transactionFee = gasPrice * gasLimit;

    // console.log({ gasPrice, gasLimit, transactionFee });
    logger.info(`The gas cost estimation for the tx calling ${functionName} is: ${transactionFee} ether`);

    return transactionFee;
  } catch (error) {
    logger.error(error);
  }
};

export const decodeTokenTxnLogs = async (name, log) => {
  const { data, topics } = log;
  const workerWallet = await getWorkerWallet();
  const tokenContract = await getTokenContract(workerWallet);
  return tokenContract.interface.decodeEventLog(name, data, topics);
};

export const claimToken = async ({ address, amount }) => {
  let txnHash;
  try {
    logger.info('start claimToken');
    logger.info({ address, amount });
    const workerWallet = await getWorkerWallet();
    const tokenContract = await getTokenContract(workerWallet);
    logger.info('start Transaction:');
    const tx = await tokenContract.mint(address, amount, { gasLimit: 200000 });
    logger.info('Transaction:' + tx.hash);
    txnHash = tx.hash;
    const receipt = await tx.wait();

    if (receipt.status !== 1) {
      logger.info(`error: ${JSON.stringify(receipt)}`);
      logger.error(`error: ${JSON.stringify(receipt)}`);
      throw new Error(`error: ${JSON.stringify(receipt)}`);
    }

    return { txnHash, status: 'Success' };
  } catch (err) {
    const newError = getParsedEthersError(err);
    const regex = /(execution reverted: )([A-Za-z\s])*/;
    if (newError.context) {
      const message = newError.context.match(regex);
      if (message) {
        const error = new Error(message[0]);
        logger.error(error.message);
      }
    } else {
      logger.error(err.message);
    }

    return { txnHash: txnHash || '', status: 'Failed' };
  }
};

export const claimTokenBonus = async ({ address, amount }) => {
  let txnHash = '';
  try {
    logger.info('start claimToken bonus');
    logger.info({ address, amount });
    const workerWallet = await getWorkerWallet();
    const tokenContract = await getTokenContract(workerWallet);
    logger.info('start Transaction:');
    const tx = await tokenContract.transfer(address, amount, { gasLimit: 200000 });
    logger.info('Transaction:' + tx.hash);
    txnHash = tx.hash;
    const receipt = await tx.wait();

    if (receipt.status !== 1) {
      logger.info(`error: ${JSON.stringify(receipt)}`);
      logger.error(`error: ${JSON.stringify(receipt)}`);
      throw new Error(`error: ${JSON.stringify(receipt)}`);
    }

    return { txnHash, status: 'Success' };
  } catch (err) {
    const newError = getParsedEthersError(err);
    const regex = /(execution reverted: )([A-Za-z\s])*/;
    if (newError.context) {
      const message = newError.context.match(regex);
      if (message) {
        const error = new Error(message[0]);
        logger.error(error.message);
      }
    } else {
      logger.error(err.message);
    }

    return { txnHash: txnHash || '', status: 'Failed' };
  }
};

export const burnNFT = async ({ addresses, ids, amounts }) => {
  let txnHash;
  try {
    logger.info('start burnNFT');
    logger.info({ addresses, ids, amounts });
    const workerWallet = await getWorkerWallet();
    const gameContract = await getGameContract(workerWallet);
    logger.info('start Transaction:');
    const tx = await gameContract.burnNFT(addresses, ids, amounts);
    logger.info('Transaction:' + tx.hash);
    const receipt = await tx.wait();

    txnHash = receipt.transactionHash;

    if (receipt.status !== 1) {
      logger.error(`Unsuccessful txn: ${JSON.stringify(receipt)}`);
      throw new Error(`Unsuccessful txn: ${JSON.stringify(receipt)}`);
    }

    return { txnHash, status: 'Success' };
  } catch (err) {
    console.error(err);
    const newError = getParsedEthersError(err);
    const regex = /(execution reverted: )([A-Za-z\s])*/;
    if (newError.context) {
      const message = newError.context.match(regex);
      if (message) {
        const error = new Error(message[0]);
        logger.error(error.message);
      }
    } else {
      logger.error(err.message);
    }

    return { txnHash, status: 'Failed' };
  }
};

export const burnGoon = async ({ addresses, amounts }) => {
  let txnHash;
  try {
    logger.info('start burnGoon');
    logger.info({ addresses, amounts });
    const workerWallet = await getWorkerWallet();
    const gameContract = await getGameContract(workerWallet);
    logger.info('start Transaction:');
    const tx = await gameContract.burnGoon(addresses, amounts);
    logger.info('Transaction:' + tx.hash);
    const receipt = await tx.wait();

    txnHash = receipt.transactionHash;

    if (receipt.status !== 1) {
      logger.error(`Unsuccessful txn: ${JSON.stringify(receipt)}`);
      throw new Error(`Unsuccessful txn: ${JSON.stringify(receipt)}`);
    }

    return { txnHash, status: 'Success' };
  } catch (err) {
    console.error(err);
    const newError = getParsedEthersError(err);
    const regex = /(execution reverted: )([A-Za-z\s])*/;
    if (newError.context) {
      const message = newError.context.match(regex);
      if (message) {
        const error = new Error(message[0]);
        logger.error(error.message);
      }
    } else {
      logger.error(err.message);
    }

    return { txnHash, status: 'Failed' };
  }
};

export const setGameClosed = async (isGameClosed) => {
  let txnHash;
  try {
    logger.info('start setGameClosed');
    logger.info({ isGameClosed });
    const workerWallet = await getWorkerWallet();
    const gameContract = await getGameContract(workerWallet);
    logger.info('start Transaction:');
    const tx = await gameContract.setGameClosed(Boolean(isGameClosed));
    logger.info('Transaction:' + tx.hash);
    const receipt = await tx.wait();

    txnHash = receipt.transactionHash;

    if (receipt.status !== 1) {
      logger.error(`Unsuccessful txn: ${JSON.stringify(receipt)}`);
      throw new Error(`Unsuccessful txn: ${JSON.stringify(receipt)}`);
    }

    return { txnHash, status: 'Success' };
  } catch (err) {
    console.error(err);
    const newError = getParsedEthersError(err);
    const regex = /(execution reverted: )([A-Za-z\s])*/;
    if (newError.context) {
      const message = newError.context.match(regex);
      if (message) {
        const error = new Error(message[0]);
        logger.error(error.message);
      }
    } else {
      logger.error(err.message);
    }

    return { txnHash, status: 'Failed' };
  }
};

export const setWinner = async ({ winners, points }) => {
  let txnHash;
  try {
    logger.info('start setWinner');
    logger.info({ winners, points });
    const workerWallet = await getWorkerWallet();
    const gameContract = await getGameContract(workerWallet);
    logger.info('start Transaction:');
    const tx = await gameContract.setWinner(winners, points);
    logger.info('Transaction:' + tx.hash);
    const receipt = await tx.wait();

    txnHash = receipt.transactionHash;

    if (receipt.status !== 1) {
      logger.error(`Unsuccessful txn: ${JSON.stringify(receipt)}`);
      throw new Error(`Unsuccessful txn: ${JSON.stringify(receipt)}`);
    }

    return { txnHash, status: 'Success' };
  } catch (err) {
    console.error(err);
    const newError = getParsedEthersError(err);
    const regex = /(execution reverted: )([A-Za-z\s])*/;
    if (newError.context) {
      const message = newError.context.match(regex);
      if (message) {
        const error = new Error(message[0]);
        logger.error(error.message);
      }
    } else {
      logger.error(err.message);
    }

    return { txnHash, status: 'Failed' };
  }
};

export const isMinted = async (address) => {
  const workerWallet = await getWorkerWallet();
  const gameContract = await getGameContract(workerWallet);

  const minted = await gameContract.mintedAddess(address);
  return minted;
};

export const signMessage = async (message) => {
  const workerWallet = await getWorkerWallet();
  const signature = await workerWallet.signMessage(ethers.toBeArray(message));
  return signature;
};

export const signMessageBuyGoon = async ({ address, amount, value, nonce }) => {
  const workerWallet = await getWorkerWallet();
  console.log({ address, amount, value: value.toString(10), nonce });
  let message = ethers.solidityPackedKeccak256(
    // Array of types: declares the data types in the message.
    ['address', 'uint256', 'uint256', 'uint256'],
    // Array of values: actual values of the parameters to be hashed.
    [address, amount, value.toString(10), nonce]
  );

  const signature = await workerWallet.signMessage(ethers.toBeArray(message));
  return signature;
};

export const signMessageBuyGangster = async ({ address, amount, nonce, referral }) => {
  const workerWallet = await getWorkerWallet();
  console.log({ address, amount, nonce, referral });

  // Array of types: declares the data types in the message.
  const types = ['address', 'uint256', 'uint256', 'uint256'];
  // Array of values: actual values of the parameters to be hashed.
  const values = [address, 1, amount, nonce];

  if (referral) {
    types.push('address');
    values.push(referral);
  }

  let message = ethers.solidityPackedKeccak256(types, values);

  const signature = await workerWallet.signMessage(ethers.toBeArray(message));
  return signature;
};
