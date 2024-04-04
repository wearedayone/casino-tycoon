import JSBI from 'jsbi';
import { TickMath, FullMath } from '@uniswap/v3-sdk';
import { Contract } from '@ethersproject/contracts';
import { formatEther, parseEther } from '@ethersproject/units';
import { firestore } from '../configs/admin.config.js';
import quickNode from '../configs/quicknode.config.js';
import environments from '../utils/environments.js';
import UniswapABI from '../assets/abis/Uniswap.json' assert { type: 'json' };
import TokenAbi from '../assets/abis/Token.json' assert { type: 'json' };
import RouterABI from '@uniswap/v2-periphery/build/IUniswapV2Router02.json' assert { type: 'json' };
import PairABI from '@uniswap/v2-core/build/IUniswapV2Pair.json' assert { type: 'json' };

const { UNISWAP_CONTRACT_ADDRESS } = environments;

async function getPrice({ currentTick, inputAmount, baseTokenDecimals, quoteTokenDecimals }) {
  try {
    const sqrtRatioX96 = TickMath.getSqrtRatioAtTick(currentTick);
    const ratioX192 = JSBI.multiply(sqrtRatioX96, sqrtRatioX96);

    const baseAmount = JSBI.BigInt(inputAmount * 10 ** baseTokenDecimals);

    const shift = JSBI.leftShift(JSBI.BigInt(1), JSBI.BigInt(192));

    const quoteAmount = FullMath.mulDivRoundingUp(ratioX192, baseAmount, shift);

    return 10 ** quoteTokenDecimals / quoteAmount;
  } catch (err) {
    console.log({ err });
  }
}

export const updateFIATPriceUniswapV3 = async () => {
  try {
    const contract = new Contract(UNISWAP_CONTRACT_ADDRESS, UniswapABI.abi, quickNode);
    const { tick } = await contract.slot0();

    const quote = await getPrice({
      currentTick: tick,
      inputAmount: 1,
      baseTokenDecimals: 18,
      quoteTokenDecimals: 18,
    });
    const uniswapPrice = parseFloat(quote).toFixed(12);
    console.log({ uniswapPrice });

    const market = await firestore.collection('system').doc('market').get();
    if (market.exists) {
      const { tokenPrice } = market.data();
      console.log({ uniswapPrice, tokenPrice });
      if (tokenPrice !== uniswapPrice) {
        await firestore.collection('system').doc('market').update({
          tokenPrice: uniswapPrice,
        });
      }
    } else {
      await firestore.collection('system').doc('market').set({
        tokenPrice: uniswapPrice,
      });
    }
  } catch (err) {
    console.log({ err });
  }
};

export const updateFIATPriceUniswapV2 = async () => {
  try {
    let tokenAmount = 1;
    const { tokenAddress, wethAddress, routerContract, swapReceivePercent } = await getSwapContractInfo();

    const tokenAmountFeesIncluded = tokenAmount * swapReceivePercent;
    const amountIn = parseEther(`${tokenAmountFeesIncluded}`);
    console.log(amountIn, [tokenAddress, wethAddress]);
    const res = await routerContract.getAmountsOut(amountIn, [tokenAddress, wethAddress]);
    const amount = formatEther(res[1]);
    const uniswapPrice = parseFloat(amount).toFixed(12);

    const market = await firestore.collection('system').doc('market').get();
    if (market.exists) {
      const { tokenPrice } = market.data();
      console.log({ uniswapPrice, tokenPrice });
      if (tokenPrice !== uniswapPrice) {
        await firestore.collection('system').doc('market').update({
          tokenPrice: uniswapPrice,
        });
      }
    } else {
      await firestore.collection('system').doc('market').set({
        tokenPrice: uniswapPrice,
      });
    }
  } catch (err) {
    console.error(err);
    console.log(err, new Date().toLocaleString());
  }
};

const getSwapContractInfo = async () => {
  const systemConfig = await firestore.collection('system').doc('default').get();
  if (!systemConfig.exists) return {};
  const { activeSeasonId } = systemConfig.data();

  const season = await firestore.collection('season').doc(activeSeasonId).get();
  if (!season.exists) return {};

  const {
    tokenAddress: TOKEN_ADDRESS,
    gameAddress: GAME_CONTRACT_ADDRESS,
    nftAddress: NFT_ADDRESS,
    routerAddress: ROUTER_ADDRESS,
    wethAddress: WETH_ADDRESS,
    pairAddress: PAIR_ADDRESS,
  } = season.data() || {};

  const tokenAddress = TOKEN_ADDRESS;
  const routerAddress = ROUTER_ADDRESS;
  const wethAddress = WETH_ADDRESS;
  const pairAddress = PAIR_ADDRESS;

  const routerContract = new Contract(routerAddress, RouterABI.abi, quickNode);
  const tokenContract = new Contract(tokenAddress, TokenAbi.abi, quickNode);
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
