const { ethers } = require('hardhat');
const { parseEther, formatEther } = require('ethers');

const gameConfigs = require('../configs/game.config');

const {
  assets: { machine },
  prizePool,
  referral,
} = gameConfigs;

const _nftAddress = '0xd4C9821eeEDe45F478a58CaE6030698F7f757fC8';
const _gaAddress = '0x22013908546b2Cb174Bc165fCbe221bda52d621C';

async function main() {
  const GangsterNFT = await ethers.getContractAt('Gangster', _nftAddress);
  if (machine.maxPerBatch) {
    console.log('update maxPerBatch');
    const res = await GangsterNFT.MAX_PER_BATCH();
    const currentMaxPerBatch = Number(res.toString());
    if (machine.maxPerBatch !== currentMaxPerBatch) {
      console.log(
        `updating maxPerBatch, contract current value: ${currentMaxPerBatch}, correct value: ${machine.maxPerBatch}`
      );
      await GangsterNFT.setMaxPerBatch(machine.maxPerBatch);
    }
    console.log('update maxPerBatch done');
  }
  if (machine.maxWhitelistAmount) {
    console.log('update maxPerWL');
    const res = await GangsterNFT.MAX_PER_WL();
    const currentMaxPerWL = Number(res.toString());
    if (machine.maxWhitelistAmount !== currentMaxPerWL) {
      console.log(
        `updating maxPerWL, contract current value: ${currentMaxPerWL}, correct value: ${machine.maxWhitelistAmount}`
      );
      await GangsterNFT.setMaxPerWL(machine.maxWhitelistAmount);
    }
    console.log('update maxPerWL done');
  }

  const GangsterArena = await ethers.getContractAt('GangsterArena', _gaAddress);

  if (machine.basePrice) {
    console.log('update basePrice');
    const res = await GangsterArena.BASE_PRICE();
    const currentBasePrice = Number(formatEther(res));
    if (machine.basePrice !== currentBasePrice) {
      console.log(
        `updating basePrice, contract current value: ${currentBasePrice}, correct value: ${machine.basePrice}`
      );
      await GangsterArena.setBasePrice(parseEther(`${machine.basePrice}`));
    }

    console.log('update basePrice done');
  }

  if (machine.whitelistPrice) {
    console.log('update basePriceWL');
    const res = await GangsterArena.BASE_PRICE_WL();
    const currentBasePriceWL = Number(formatEther(res));
    if (machine.whitelistPrice !== currentBasePriceWL) {
      console.log(
        `updating basePriceWL, contract current value: ${currentBasePriceWL}, correct value: ${machine.whitelistPrice}`
      );
      await GangsterArena.setBasePriceWL(parseEther(`${machine.whitelistPrice}`));
    }

    console.log('update basePriceWL done');
  }

  if (prizePool) {
    console.log('update game fees');
    const res1 = await GangsterArena.DEV_PERCENT();
    const res2 = await GangsterArena.MARKETING_PERCENT();
    const res3 = await GangsterArena.PRIZE_PERCENT();
    const res4 = await GangsterArena.RETIRE_PERCENT();

    const currentDevFee = Number(res1.toString());
    const currentMarketingFee = Number(res2.toString());
    const currentPrizeFee = Number(res3.toString());
    const currentReputationFee = Number(res4.toString());

    const { devFee, marketingFee, rankRewardsPercent, reputationRewardsPercent } = prizePool;

    if (
      devFee * 10000 !== currentDevFee ||
      marketingFee * 10000 !== currentMarketingFee ||
      rankRewardsPercent * 10000 !== currentPrizeFee ||
      reputationRewardsPercent * 10000 !== currentReputationFee
    ) {
      console.log(
        `update game fees, contract current value: ${JSON.stringify({
          dev: currentDevFee,
          marketing: currentMarketingFee,
          prize: currentPrizeFee,
          reputation: currentReputationFee,
        })}, correct value: ${JSON.stringify({
          dev: devFee * 10000,
          marketing: marketingFee * 10000,
          prize: rankRewardsPercent * 10000,
          reputation: reputationRewardsPercent * 10000,
        })}`
      );
      await GangsterArena.setGameFee(
        devFee * 10000,
        marketingFee * 10000,
        rankRewardsPercent * 10000,
        reputationRewardsPercent * 10000
      );
    }

    console.log('update game fees done');
  }

  if (referral) {
    console.log('update referral');
    if (referral.referralBonus) {
      console.log('update referral bonus');
      const res = await GangsterArena.BASE_REFERRAL();
      const currentReferralBonus = Number(res.toString());
      if (referral.referralBonus * 10000 !== currentReferralBonus) {
        console.log(
          `updating referralBonus, contract current value: ${currentReferralBonus}, correct value: ${
            referral.referralBonus * 10000
          }`
        );
        await GangsterArena.setBaseReferral(referral.referralBonus * 10000);
      }
      console.log('update referral bonus done');
    }

    if (referral.referralDiscount) {
      console.log('update referral discount');
      const res = await GangsterArena.BASE_REFERRAL_DISCOUNT();
      const currentReferralDiscount = Number(res.toString());
      if ((1 - referral.referralDiscount) * 10000 !== currentReferralDiscount) {
        console.log(
          `updating referralDiscount, contract current value: ${currentReferralDiscount}, correct value: ${
            (1 - referral.referralDiscount) * 10000
          }`
        );
        await GangsterArena.setBaseReferralDiscount((1 - referral.referralDiscount) * 10000);
      }
      console.log('update referral discount done');
    }
    console.log('update referral done');
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
