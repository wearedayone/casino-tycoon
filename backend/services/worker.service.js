import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import { formatEther, parseEther as UnitPasteEther } from '@ethersproject/units';
import { ethers, isError, parseEther } from 'ethers';
import { getParsedEthersError } from '@enzoferey/ethers-error-parser';
import { Utils } from 'alchemy-sdk';

import tokenABI from '../assets/abis/Token.json' assert { type: 'json' };
import nftABI from '../assets/abis/NFT.json' assert { type: 'json' };
import gameContractABI from '../assets/abis/GameContract.json' assert { type: 'json' };
import environments from '../utils/environments.js';
import alchemy from '../configs/alchemy.config.js';
import logger from '../utils/logger.js';
import { getActiveSeason } from './season.service.js';

const { WORKER_WALLET_PRIVATE_KEY, SIGNER_WALLET_PRIVATE_KEY } = environments;

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

const getTokenContract = async (signer) => {
  const activeSeason = await getActiveSeason();
  const { tokenAddress: TOKEN_ADDRESS } = activeSeason || {};
  const contract = new Contract(TOKEN_ADDRESS, tokenABI.abi, signer);
  return contract;
};

const getNftContract = async (signer) => {
  const activeSeason = await getActiveSeason();
  const { nftAddress } = activeSeason || {};
  const contract = new Contract(nftAddress, nftABI.abi, signer);
  return contract;
};

const getGameContract = async (signer) => {
  const activeSeason = await getActiveSeason();
  const { gameAddress: GAME_CONTRACT_ADDRESS } = activeSeason || {};
  const contract = new Contract(GAME_CONTRACT_ADDRESS, gameContractABI.abi, signer);
  return contract;
};

export const decodeTokenTxnLogs = async (name, log) => {
  const { data, topics } = log;
  const workerWallet = await getWorkerWallet();
  const tokenContract = await getTokenContract(workerWallet);
  return tokenContract.interface.decodeEventLog(name, data, topics);
};

export const claimToken = async ({ address, amount }) => {
  let txnHash = '';
  let isSuccess = false;
  let retry = 0;

  while (!isSuccess && retry < 10) {
    try {
      logger.info(`Start claimToken - ${retry++} times`);
      logger.info({ address, amount });
      const ethersProvider = await alchemy.config.getProvider();
      const workerWallet = await getWorkerWallet();
      const tokenContract = await getTokenContract(workerWallet);

      const baseGasPrice = await ethersProvider.getGasPrice();
      const gasPrice = (baseGasPrice.toBigInt() * BigInt(Math.round(Math.pow(1.2, retry) * 1000000))) / BigInt(1000000);

      logger.info(`Start claimToken transaction with gasPrice: ${JSON.stringify(gasPrice)}`);
      const tx = await tokenContract.mint(address, amount, { gasPrice });
      logger.info('Transaction claimToken:' + tx.hash);
      txnHash = tx.hash;
      const receipt = await tx.wait();

      if (receipt.status !== 1) {
        logger.info(`error: ${JSON.stringify(receipt)}`);
        logger.error(`error: ${JSON.stringify(receipt)}`);
        throw new Error(`API error: Txn failed`);
      }
      isSuccess = true;
      logger.info(`Finished claimToken transaction with txnHash: ${txnHash}`);
      return { txnHash, status: 'Success' };
    } catch (err) {
      try {
        logger.info(`Error claimToken transaction with txnHash: ${txnHash}`);
        if (isError(err, 'UNPREDICTABLE_GAS_LIMIT')) {
          logger.info('UNPREDICTABLE_GAS_LIMIT');
        } else if (isError(err, 'TRANSACTION_REPLACED')) {
          logger.info('TRANSACTION_REPLACED');
        } else if (isError(err, 'REPLACEMENT_UNDERPRICED')) {
          logger.info('REPLACEMENT_UNDERPRICED');
        } else if (isError(err, 'NONCE_EXPIRED')) {
          logger.info('NONCE_EXPIRED');
        } else if (isError(err, 'NETWORK_ERROR')) {
          logger.info('NETWORK_ERROR');
        } else if (isError(err, 'SERVER_ERROR')) {
          logger.info('SERVER_ERROR');
        } else if (isError(err, 'INSUFFICIENT_FUNDS')) {
          logger.info('INSUFFICIENT_FUNDS');
        } else if (isError(err, 'ACTION_REJECTED')) {
          logger.info('ACTION_REJECTED');
        } else {
          logger.info('Other Error');
        }

        logger.info(`Unsuccessful txn: ${JSON.stringify(err)}`);
        logger.error(`Unsuccessful txn: ${JSON.stringify(err)}`);

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
      } catch {
        logger.info('Error happened at claimToken catch');
      }
    }
  }
  return { txnHash: txnHash || '', status: 'Failed' };
};

export const claimTokenBatch = async ({ addresses, amounts }) => {
  let txnHash = '';
  let isSuccess = false;
  let retry = 0;
  const ethersProvider = await alchemy.config.getProvider();
  while (!isSuccess && retry < 10) {
    try {
      logger.info(`Start claimTokenBatch. Retry ${retry++} times`);
      logger.info({ addresses, amounts });
      const workerWallet = await getWorkerWallet();
      const tokenContract = await getTokenContract(workerWallet);

      const baseGasPrice = await ethersProvider.getGasPrice();
      const gasPrice = (baseGasPrice.toBigInt() * BigInt(Math.round(Math.pow(1.2, retry) * 1000000))) / BigInt(1000000);
      logger.info(`Start claimTokenBatch transaction with gasPrice: ${JSON.stringify(gasPrice)}`);
      const tx = await tokenContract.batchMint(addresses, amounts, { gasPrice });
      txnHash = tx.hash;
      logger.info('ClaimTokenBatch Transaction:' + tx.hash);
      const receipt = await tx.wait();

      if (receipt.status !== 1) {
        logger.error(`Unsuccessful txn: ${JSON.stringify(receipt)}`);
        throw new Error(`API error: Txn failed`);
      }
      isSuccess = true;
      logger.info(`Finished ClaimTokenBatch transaction with txnHash: ${txnHash}`);
      return { txnHash, status: 'Success' };
    } catch (err) {
      try {
        logger.info(`Error claimTokenBatch transaction with txnHash: ${txnHash}`);
        if (isError(err, 'UNPREDICTABLE_GAS_LIMIT')) {
          logger.info('UNPREDICTABLE_GAS_LIMIT');
        } else if (isError(err, 'TRANSACTION_REPLACED')) {
          logger.info('TRANSACTION_REPLACED');
        } else if (isError(err, 'REPLACEMENT_UNDERPRICED')) {
          logger.info('REPLACEMENT_UNDERPRICED');
        } else if (isError(err, 'NONCE_EXPIRED')) {
          logger.info('NONCE_EXPIRED');
        } else if (isError(err, 'NETWORK_ERROR')) {
          logger.info('NETWORK_ERROR');
        } else if (isError(err, 'SERVER_ERROR')) {
          logger.info('SERVER_ERROR');
        } else if (isError(err, 'INSUFFICIENT_FUNDS')) {
          logger.info('INSUFFICIENT_FUNDS');
        } else if (isError(err, 'ACTION_REJECTED')) {
          logger.info('ACTION_REJECTED');
        } else {
          logger.info('Other Error');
        }

        logger.info(`Unsuccessful txn: ${JSON.stringify(err)}`);
        logger.error(`Unsuccessful txn: ${JSON.stringify(err)}`);

        const newError = getParsedEthersError(err);
        const regex = /(execution reverted: )([A-Za-z\s])*/;
        if (newError.context) {
          const message = newError.context.match(regex);
          if (message) {
            logger.error(message[0]);
          }
        } else {
          logger.error(err.message);
        }
      } catch {
        logger.info('Error happened at claimTokenBatch catch');
      }
    }
  }
  return { txnHash, status: 'Failed' };
};

export const burnNFT = async ({ addresses, ids, amounts }) => {
  let txnHash = '';
  let isSuccess = false;
  let retry = 0;
  const ethersProvider = await alchemy.config.getProvider();
  while (!isSuccess && retry < 10) {
    try {
      logger.info(`Start burnNFT. Retry ${retry++} times`);
      logger.info({ addresses, ids, amounts });
      const workerWallet = await getWorkerWallet();
      const gameContract = await getGameContract(workerWallet);

      const baseGasPrice = await ethersProvider.getGasPrice();
      const gasPrice = (baseGasPrice.toBigInt() * BigInt(Math.round(Math.pow(1.2, retry) * 1000000))) / BigInt(1000000);
      logger.info(`Start burnNFT transaction with gasPrice: ${JSON.stringify(gasPrice)}`);
      const tx = await gameContract.burnNFT(addresses, ids, amounts, { gasPrice });
      txnHash = tx.hash;
      logger.info('BurnNFT Transaction:' + tx.hash);
      const receipt = await tx.wait();

      if (receipt.status !== 1) {
        logger.error(`Unsuccessful txn: ${JSON.stringify(receipt)}`);
        throw new Error(`API error: Txn failed`);
      }
      isSuccess = true;
      logger.info(`Finished burnNFT transaction with txnHash: ${txnHash}`);
      return { txnHash, status: 'Success' };
    } catch (err) {
      try {
        logger.info(`Error burnNFT transaction with txnHash: ${txnHash}`);
        if (isError(err, 'UNPREDICTABLE_GAS_LIMIT')) {
          logger.info('UNPREDICTABLE_GAS_LIMIT');
        } else if (isError(err, 'TRANSACTION_REPLACED')) {
          logger.info('TRANSACTION_REPLACED');
        } else if (isError(err, 'REPLACEMENT_UNDERPRICED')) {
          logger.info('REPLACEMENT_UNDERPRICED');
        } else if (isError(err, 'NONCE_EXPIRED')) {
          logger.info('NONCE_EXPIRED');
        } else if (isError(err, 'NETWORK_ERROR')) {
          logger.info('NETWORK_ERROR');
        } else if (isError(err, 'SERVER_ERROR')) {
          logger.info('SERVER_ERROR');
        } else if (isError(err, 'INSUFFICIENT_FUNDS')) {
          logger.info('INSUFFICIENT_FUNDS');
        } else if (isError(err, 'ACTION_REJECTED')) {
          logger.info('ACTION_REJECTED');
        } else {
          logger.info('Other Error');
        }

        logger.info(`Unsuccessful txn: ${JSON.stringify(err)}`);
        logger.error(`Unsuccessful txn: ${JSON.stringify(err)}`);
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
      } catch {
        logger.info('Error happened at burnNFT catch');
      }
    }
  }
  return { txnHash, status: 'Failed' };
};

export const burnGoon = async ({ addresses, amounts }) => {
  let txnHash = '';
  try {
    logger.info('start burnGoon');
    logger.info({ addresses, amounts });
    const workerWallet = await getWorkerWallet();
    const gameContract = await getGameContract(workerWallet);
    logger.info('start Transaction:');
    const tx = await gameContract.burnGoon(addresses, amounts);
    logger.info('Transaction:' + tx.hash);
    txnHash = tx.hash;
    const receipt = await tx.wait();

    if (receipt.status !== 1) {
      logger.error(`Unsuccessful txn: ${JSON.stringify(receipt)}`);
      throw new Error(`API error: Txn failed`);
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

export const setGameClosed = async (isGameClosed, totalPoints) => {
  let txnHash = '';
  try {
    logger.info('start setGameClosed');
    logger.info({ isGameClosed });
    const workerWallet = await getWorkerWallet();
    const gameContract = await getGameContract(workerWallet);
    logger.info('start Transaction:');
    const tx = await gameContract.setGameClosed(Boolean(isGameClosed), totalPoints);
    logger.info('Transaction:' + tx.hash);
    txnHash = tx.hash;
    const receipt = await tx.wait();

    if (receipt.status !== 1) {
      logger.error(`Unsuccessful txn: ${JSON.stringify(receipt)}`);
      throw new Error(`API error: Txn failed`);
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
  let txnHash = '';
  try {
    logger.info('start setWinner');
    logger.info({ winners, points });
    const ethersProvider = await alchemy.config.getProvider();
    const gasPrice = await ethersProvider.getGasPrice();
    const workerWallet = await getWorkerWallet();
    const gameContract = await getGameContract(workerWallet);
    logger.info('start Transaction:');
    const tx = await gameContract.setWinner(winners, points, { gasPrice });
    logger.info('Transaction:' + tx.hash);
    txnHash = tx.hash;
    const receipt = await tx.wait();

    txnHash = receipt.transactionHash;

    if (receipt.status !== 1) {
      logger.error(`Unsuccessful txn: ${JSON.stringify(receipt)}`);
      throw new Error(`API error: Txn failed`);
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
  const nftContract = await getNftContract(workerWallet);

  const minted = await nftContract.mintedAddess(address);
  return minted;
};

export const getTotalSold = async (type, address) => {
  const workerWallet = await getWorkerWallet();
  const gameContract = await getGameContract(workerWallet);

  const totalSold = type == 'buy-worker' ? await gameContract.goon(address) : await gameContract.safehouse(address);
  return totalSold.toNumber();
};

export const signMessage = async (message) => {
  const signerWallet = await getSignerWallet();
  const signature = await signerWallet.signMessage(ethers.toBeArray(message));
  return signature;
};

export const signMessageBuyGoon = async ({ address, amount, value, totalAmount, time, nonce, mintFunction }) => {
  const signerWallet = await getSignerWallet();
  console.log({ address, amount, value: value.toString(), nonce });
  let message = ethers.solidityPackedKeccak256(
    // Array of types: declares the data types in the message.
    ['address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'string'],
    // Array of values: actual values of the parameters to be hashed.
    [address, amount, value.toString(), totalAmount, time, nonce, mintFunction]
  );

  const signature = await signerWallet.signMessage(ethers.toBeArray(message));
  return signature;
};

export const signMessageBuyGangster = async ({ address, amount, referral, time, nonce, mintFunction }) => {
  const signerWallet = await getSignerWallet();
  console.log({ address, amount, nonce, referral });

  // Array of types: declares the data types in the message.
  const types = ['address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'string'];
  // Array of values: actual values of the parameters to be hashed.
  const values = [address, 1, amount, BigInt(parseEther('0').toString()), time, nonce, mintFunction];

  if (referral) {
    types.splice(4, 0, 'address');
    values.splice(4, 0, referral);
  }

  let message = ethers.solidityPackedKeccak256(types, values);

  const signature = await signerWallet.signMessage(ethers.toBeArray(message));
  return signature;
};

export const signMessageRetire = async ({ address, reward, nonce }) => {
  const signerWallet = await getSignerWallet();
  // Array of types: declares the data types in the message.
  const types = ['address', 'uint256', 'uint256'];
  // Array of values: actual values of the parameters to be hashed.
  const values = [address, BigInt(parseEther(reward.toString()).toString()), nonce];

  let message = ethers.solidityPackedKeccak256(types, values);

  console.log('message', message);

  const signature = await signerWallet.signMessage(ethers.toBeArray(message));
  return signature;
};

export const getTokenBalance = async ({ address }) => {
  const ethersProvider = await alchemy.config.getProvider();
  const activeSeason = await getActiveSeason();
  const { tokenAddress: TOKEN_ADDRESS } = activeSeason || {};
  const contract = new Contract(TOKEN_ADDRESS, tokenABI.abi, ethersProvider);
  const value = await contract.balanceOf(address);
  return value;
};

export const getNFTBalance = async ({ address }) => {
  const ethersProvider = await alchemy.config.getProvider();
  const activeSeason = await getActiveSeason();
  const { nftAddress } = activeSeason || {};
  const contract = new Contract(nftAddress, nftABI.abi, ethersProvider);
  const value = await contract.gangster(address);
  return value;
};
