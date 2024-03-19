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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

const burnFiat = async () => {
  try {
    console.log('1. start burn FIAT job', new Date().toLocaleString());
    const ethersProvider = await alchemy.config.getProvider();
    const marketingWallet = new Wallet(MARKETING_WALLET_PRIVATE_KEY, ethersProvider);
    const gameContract = await getGameContract(marketingWallet);
    let walletBalance = await ethersProvider.getBalance(marketingWallet.address);
    let burnValue = parseEther('0.01');
    const minWalletValue = parseEther('0.2');

    if (walletBalance.lt(minWalletValue.add(burnValue))) {
      // withdraw from game contract
      const withdrawable = await gameContract.getMarketingBalance();
      if (withdrawable.gt(parseEther('0'))) {
        let gasPrice = await ethersProvider.getGasPrice();
        const tx1 = await gameContract.markettingWithdraw({ gasPrice: gasPrice });
      }
      // update wallet balance
      walletBalance = await ethersProvider.getBalance(marketingWallet.address);
      if (walletBalance.lte(minWalletValue)) {
        burnValue = parseEther('0');
      } else if (walletBalance.lte(minWalletValue.add(burnValue))) {
        burnValue = walletBalance.sub(minWalletValue);
      }
    }
    if (burnValue.eq(parseEther('0'))) return;

    const sleepTimeInMins = Math.floor(Math.random() * 50);
    console.log(`Burn value is ${formatEther(burnValue)} in next ${sleepTimeInMins} mins`);
    await sleep(sleepTimeInMins * 60 * 1000);

    // swap to fiat
    console.log('2. start swapping to FIAT');
    // return;
    const routerContract = await getUniswapRouterContract(marketingWallet);
    const { tokenAddress, wethAddress, routerAddress } = await getAddress();
    const paths = [wethAddress, tokenAddress];
    const deadline = Math.floor(Date.now() / 1000 + 10 * 60);
    const params = [0, paths, marketingWallet.address, deadline];
    const data = routerContract.interface.encodeFunctionData(
      'swapExactETHForTokensSupportingFeeOnTransferTokens',
      params
    );
    let gasPrice = await ethersProvider.getGasPrice();
    const tx2 = await marketingWallet.sendTransaction({
      to: routerAddress,
      data,
      value: burnValue,
      gasPrice: gasPrice,
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
    gasPrice = await ethersProvider.getGasPrice();
    const tx3 = await tokenContract.burn(parseEther(balance), { gasPrice: gasPrice });
    const receipt3 = await tx3.wait();
    console.log(`3. done burning ${balance} FIAT. Txn hash ${receipt3.transactionHash}`);
  } catch (err) {
    console.error(err);
  }
};

export default burnFiat;
