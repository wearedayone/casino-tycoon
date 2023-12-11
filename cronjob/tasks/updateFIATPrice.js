import JSBI from 'jsbi';
import { TickMath, FullMath } from '@uniswap/v3-sdk';
import { Contract } from '@ethersproject/contracts';
import { formatEther } from '@ethersproject/units';
import { firestore } from '../configs/admin.config.js';
import alchemy from '../configs/alchemy.config.js';
import environments from '../utils/environments.js';
import UniswapABI from '../assets/abis/Uniswap.json' assert { type: 'json' };

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

const updateFIATPrice = async () => {
  try {
    const provider = await alchemy.config.getProvider();
    const contract = new Contract(UNISWAP_CONTRACT_ADDRESS, UniswapABI.abi, provider);
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

updateFIATPrice();
