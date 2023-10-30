import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import { formatBytes32String } from '@ethersproject/strings';
import { getParsedEthersError } from '@enzoferey/ethers-error-parser';

import tokenABI from '../assets/abis/Token.json' assert { type: 'json' };
import environments from '../utils/environments.js';
import alchemy from '../configs/alchemy.config.js';
import logger from '../utils/logger.js';

const { WORKER_WALLET_PRIVATE_KEY, TOKEN_ADDRESS } = environments;

const getWorkerWallet = async () => {
  const ethersProvider = await alchemy.config.getProvider();
  const workerWallet = new Wallet(WORKER_WALLET_PRIVATE_KEY, ethersProvider);
  return workerWallet;
};

const getTokenContract = async (signer) => {
  const contract = new Contract(TOKEN_ADDRESS, tokenABI.abi, signer);
  return contract;
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
    const receipt = await tx.wait();

    txnHash = receipt.transactionHash;

    if (receipt.status !== 1) {
      logger.info(`error: ${JSON.stringify(receipt)}`);
      logger.error(`error: ${JSON.stringify(receipt)}`);
      throw new Error(`error: ${JSON.stringify(receipt)}`);
    }

    return { txnHash, status: 'success' };
  } catch (err) {
    const newError = getParsedEthersError(err);
    const regex = /(execution reverted: )([A-Za-z\s])*/;
    if (newError.context) {
      const message = newError.context.match(regex);
      if (message) {
        const error = new Error(message[0]);
        log.error(error.message);
      }
    } else {
      log.error(err.message);
    }

    return { txnHash, status: 'failed' };
  }
};
