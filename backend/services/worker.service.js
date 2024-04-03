import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import { formatEther, parseEther } from '@ethersproject/units';
import { ethers, isError } from 'ethers';
import { getParsedEthersError } from '@enzoferey/ethers-error-parser';

import tokenABI from '../assets/abis/Token.json' assert { type: 'json' };
import nftABI from '../assets/abis/NFT.json' assert { type: 'json' };
import gameContractABI from '../assets/abis/GameContract.json' assert { type: 'json' };
import environments from '../utils/environments.js';
import logger from '../utils/logger.js';
import { getActiveSeason } from './season.service.js';
import RouterABI from '@uniswap/v2-periphery/build/IUniswapV2Router02.json' assert { type: 'json' };
import PairABI from '@uniswap/v2-core/build/IUniswapV2Pair.json' assert { type: 'json' };
import quickNode from '../configs/quicknode.config.js';

const { WORKER_WALLET_PRIVATE_KEY, SIGNER_WALLET_PRIVATE_KEY } = environments;

const getWorkerWallet = async () => {
  const workerWallet = new Wallet(WORKER_WALLET_PRIVATE_KEY, quickNode);
  return workerWallet;
};

const getSignerWallet = async () => {
  const workerWallet = new Wallet(SIGNER_WALLET_PRIVATE_KEY, quickNode);
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

export const decodeGameTxnLogs = async (name, log) => {
  const { data, topics } = log;
  const workerWallet = await getWorkerWallet();
  const gameContract = await getGameContract(workerWallet);
  return gameContract.interface.decodeEventLog(name, data, topics);
};

export const claimToken = async ({ address, amount }) => {
  let txnHash = '';
  let isSuccess = false;
  let retry = 0;

  while (!isSuccess && retry < 10) {
    try {
      logger.info(`Start claimToken - ${retry++} times`);
      logger.info({ address, amount });
      const workerWallet = await getWorkerWallet();
      const tokenContract = await getTokenContract(workerWallet);

      const baseGasPrice = await quickNode.getGasPrice();
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

export const setWarResult = async ({ addresses, lostGangsters, lostGoons, wonReputations, wonTokens }) => {
  let txnHash = '';
  let isSuccess = false;
  let retry = 0;
  while (!isSuccess && retry < 10) {
    try {
      logger.info(`Start setWarResult. Retry ${retry++} times`);
      logger.info({ addresses, lostGangsters, lostGoons, wonReputations, wonTokens });
      const workerWallet = await getWorkerWallet();
      const gameContract = await getGameContract(workerWallet);

      const baseGasPrice = await quickNode.getGasPrice();
      const gasPrice = (baseGasPrice.toBigInt() * BigInt(Math.round(Math.pow(1.2, retry) * 1000000))) / BigInt(1000000);
      logger.info(`Start setWarResult transaction with gasPrice: ${JSON.stringify(gasPrice)}`);
      const tx = await gameContract.finalWarResult(addresses, lostGangsters, lostGoons, wonReputations, wonTokens, {
        gasPrice,
      });
      txnHash = tx.hash;
      logger.info('finalWarResult Transaction:' + tx.hash);
      const receipt = await tx.wait();

      if (receipt.status !== 1) {
        logger.error(`Unsuccessful txn: ${JSON.stringify(receipt)}`);
        throw new Error(`API error: Txn failed`);
      }
      isSuccess = true;
      logger.info(`Finished setWarResult transaction with txnHash: ${txnHash}`);
      return { txnHash, status: 'Success' };
    } catch (err) {
      try {
        logger.info(`Error setWarResult transaction with txnHash: ${txnHash}`);
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
        logger.info('Error happened at setWarResult catch');
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
    const gasPrice = await quickNode.getGasPrice();
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

export const signMessage = async (message) => {
  const signerWallet = await getSignerWallet();
  const signature = await signerWallet.signMessage(ethers.toBeArray(message));
  return signature;
};

export const signMessageBuyAsset = async ({ address, type, amount, value, lastB, time, nonce }) => {
  const signerWallet = await getSignerWallet();
  console.log({ address, amount, value: value.toString(), nonce });
  let message = ethers.solidityPackedKeccak256(
    // Array of types: declares the data types in the message.
    ['address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256'],
    // Array of values: actual values of the parameters to be hashed.
    [address, type, amount, value.toString(), lastB, time, nonce]
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

export const signMessageDailySpin = async ({ address, value, nonce }) => {
  const signerWallet = await getSignerWallet();
  // Array of types: declares the data types in the message.
  const types = ['address', 'uint256', 'uint256'];
  // Array of values: actual values of the parameters to be hashed.
  const values = [address, value, nonce];

  let message = ethers.solidityPackedKeccak256(types, values);

  const signature = await signerWallet.signMessage(ethers.toBeArray(message));
  return signature;
};

export const getTokenBalance = async ({ address }) => {
  const activeSeason = await getActiveSeason();
  const { tokenAddress: TOKEN_ADDRESS } = activeSeason || {};
  const contract = new Contract(TOKEN_ADDRESS, tokenABI.abi, quickNode);
  const value = await contract.balanceOf(address);
  return value;
};

export const getNFTBalance = async ({ address }) => {
  const activeSeason = await getActiveSeason();
  const { nftAddress } = activeSeason || {};
  const contract = new Contract(nftAddress, nftABI.abi, quickNode);
  const value = await contract.gangster(address);
  return value;
};

export const getNoGangster = async ({ address }) => {
  const activeSeason = await getActiveSeason();
  const { gameAddress } = activeSeason || {};
  const contract = new Contract(gameAddress, gameContractABI.abi, quickNode);
  const value = await contract.gangsterBought(address);
  return value;
};
export const getLastBuyTime = async ({ address, type }) => {
  const activeSeason = await getActiveSeason();
  const { gameAddress } = activeSeason || {};
  const contract = new Contract(gameAddress, gameContractABI.abi, quickNode);
  const value = await contract.lastB(address, type);
  console.log({ address, type, value });
  return value.toNumber();
};

export const convertEthInputToToken = async (ethAmount) => {
  const { tokenAddress, wethAddress, routerContract, swapReceivePercent } = await getSwapContractInfo();

  const amountIn = parseEther(`${ethAmount}`);
  const res = await routerContract.getAmountsOut(amountIn, [wethAddress, tokenAddress]);
  const amount = Number(formatEther(res[1]).toString()) * swapReceivePercent;
  const tradingFee = Number(formatEther(res[1]).toString()) - amount;

  return { amount, tradingFee: tradingFee.toFixed(2) };
};

const getSwapContractInfo = async () => {
  const activeSeason = await getActiveSeason();
  const { tokenAddress, routerAddress, wethAddress, pairAddress } = activeSeason || {};

  const routerContract = new Contract(routerAddress, RouterABI.abi, quickNode);
  const tokenContract = new Contract(tokenAddress, tokenABI.abi, quickNode);
  const pairContract = new Contract(pairAddress, PairABI.abi, quickNode);

  const totalFees = await tokenContract.totalFees();
  const swapReceivePercent = (1000 - Number(totalFees.toString())) / 1000;

  return {
    routerAddress,
    tokenAddress,
    wethAddress,
    routerContract,
    tokenContract,
    pairContract,
    swapReceivePercent,
  };
};
