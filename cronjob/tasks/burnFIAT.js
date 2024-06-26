import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import RouterABI from '@uniswap/v2-periphery/build/IUniswapV2Router02.json' assert { type: 'json' };

import { parseEther, formatEther } from '@ethersproject/units';

import { firestore } from '../configs/admin.config.js';
import alchemy from '../configs/alchemy.config.js';
import environments from '../utils/environments.js';
import gameContractABI from '../assets/abis/GameContract.json' assert { type: 'json' };
import tokenABI from '../assets/abis/Token.json' assert { type: 'json' };

const { MARKETING_WALLET_PRIVATE_KEY } = environments;

const getActiveSeason = async () => {
  const configs = await firestore.collection('system').doc('default').get();
  const { activeSeasonId } = configs.data();

  const snapshot = await firestore.collection('season').doc(activeSeasonId).get();

  return { id: snapshot.id, ...snapshot.data() };
};

const getAddress = async () => {
  const activeSeason = await getActiveSeason();
  const { wethAddress, tokenAddress, gameAddress, routerAddress } = activeSeason || {};

  return { wethAddress, tokenAddress, gameAddress, routerAddress };
};

const getUniswapRouterContract = async (signer) => {
  const { routerAddress } = await getAddress();

  const contract = new Contract(routerAddress, RouterABI.abi, signer);
  return contract;
};

const getGameContract = async (signer) => {
  const { gameAddress } = await getAddress();
  const contract = new Contract(gameAddress, gameContractABI.abi, signer);
  return contract;
};

const getTokenContract = async (signer) => {
  const { tokenAddress } = await getAddress();
  const contract = new Contract(tokenAddress, tokenABI.abi, signer);
  return contract;
};

const getMarketingWallet = async () => {
  const ethersProvider = await alchemy.config.getProvider();
  const wallet = new Wallet(MARKETING_WALLET_PRIVATE_KEY, ethersProvider);
  return wallet;
};

const burnFiat = async () => {
  try {
    const marketingWallet = await getMarketingWallet();
    const gameContract = await getGameContract(marketingWallet);

    // withdraw marketing
    console.log('1. start marketing withdraw');
    const res = await gameContract.getMarketingBalance();
    const marketingBalance = formatEther(res.toString());
    const tx1 = await gameContract.markettingWithdraw();
    const receipt1 = await tx1.wait();
    console.log(`1. done marketing withdraw ${marketingBalance}eth. Txn hash ${receipt1.transactionHash}`);

    // swap to fiat
    console.log('2. start swapping to FIAT');
    const routerContract = await getUniswapRouterContract(marketingWallet);
    const { tokenAddress, wethAddress, routerAddress } = await getAddress();
    const paths = [wethAddress, tokenAddress];
    const deadline = Math.floor(Date.now() / 1000 + 10 * 60);
    const params = [0, paths, marketingWallet.address, deadline];
    const data = routerContract.interface.encodeFunctionData(
      'swapExactETHForTokensSupportingFeeOnTransferTokens',
      params
    );
    const tx2 = await marketingWallet.sendTransaction({
      to: routerAddress,
      data,
      value: parseEther(marketingBalance),
    });
    const receipt2 = await tx2.wait();
    console.log(`2. done swapping to FIAT. Txn hash ${receipt2.transactionHash}`);

    // burn fiat
    console.log(`3. start burning FIAT`);
    const tokenContract = await getTokenContract(marketingWallet);
    const balanceRes = await tokenContract.balanceOf(marketingWallet.address);
    console.log({ balanceRes });
    const balance = formatEther(balanceRes.toString());
    console.log('burn', balance);
    const tx3 = await tokenContract.burn(parseEther(balance));
    const receipt3 = await tx3.wait();
    console.log(`3. done burning ${balance} FIAT. Txn hash ${receipt3.transactionHash}`);
  } catch (err) {
    console.error(err);
  }
};

export default burnFiat;
