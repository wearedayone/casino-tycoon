const { ethers } = require('hardhat');

const { readConfigs, updateConfigs, verifyContract } = require('./_utils');
const gameConfigs = require('../configs/game.config.json');
const { formatEther, parseEther } = require('ethers');

const {
  assets: { machine },
  prizePool,
  referral,
  tokenContract: tokenContractVariables,
} = gameConfigs;

const deployGame = async () => {
  console.log('deploying game...');
  const { defaultAdmin, admin, worker, signer, token, nft } = readConfigs();

  const GangsterArena = await ethers.getContractFactory('GangsterArena');
  const gameContract = await GangsterArena.deploy(defaultAdmin, admin, worker, signer, nft, token);
  const gameAddress = await gameContract.getAddress();

  await verifyContract({
    address: gameAddress,
    constructorArguments: [defaultAdmin, admin, worker, signer, nft, token],
  });

  updateConfigs({ game: gameAddress, gameDeployed: true });
  console.log(`Game is deployed to ${gameAddress}`);
  Z;
};

const configGame = async () => {
  console.log('Configs game...');
  const { token, nft, game, pair, uniRouter } = readConfigs();

  const FIAT = await ethers.getContractFactory('FIAT');
  const fiatToken = FIAT.attach(token);
  const minterRole = await fiatToken.MINTER_ROLE();
  await fiatToken.grantRole(minterRole, game);

  await fiatToken.updateUniswapAddresses(pair, uniRouter);
  await fiatToken.updateGangsterArenaAddress(game);

  const NFT = await ethers.getContractFactory('Gangster');
  const nftContract = NFT.attach(nft);
  await nftContract.setTokenMaxSupply([0, 10000]);

  const nftMinterRole = await nftContract.MINTER_ROLE();
  await nftContract.grantRole(nftMinterRole, game);
  console.log('Configs game done');
};

const setupVariables = async () => {
  console.log('setup contract variables...');
  const { token, nft, game } = readConfigs();
  const FIAT = await ethers.getContractFactory('FIAT');
  const tokenContract = FIAT.attach(token);
  if (tokenContractVariables) {
    console.log('update token contract fees');
    const res1 = await tokenContract.revShareFee();
    const res2 = await tokenContract.liquidityFee();
    const res3 = await tokenContract.teamFee();
    const res4 = await tokenContract.burnFee();
    const res5 = await tokenContract.swapTokensAtAmount();

    const currentRevShareFee = Number(res1.toString());
    const currentLiquidityFee = Number(res2.toString());
    const currentTeamFee = Number(res3.toString());
    const currentBurnFee = Number(res4.toString());
    const currentSwapAmount = formatEther(res5.toString());
    const { revShareFee, liquidityFee, teamFee, burnFee, swapAmount } = tokenContractVariables;

    if (
      revShareFee * 1000 !== currentRevShareFee ||
      liquidityFee * 1000 !== currentLiquidityFee ||
      teamFee * 1000 !== currentTeamFee ||
      burnFee * 1000 !== currentBurnFee
    ) {
      console.log(
        `update token contract fees, contract current value: ${JSON.stringify({
          revShare: currentRevShareFee,
          liquidity: currentLiquidityFee,
          team: currentTeamFee,
          burn: currentBurnFee,
        })}, correct value: ${JSON.stringify({
          revShare: revShareFee * 1000,
          liquidity: liquidityFee * 1000,
          team: teamFee * 1000,
          burn: burnFee * 1000,
        })}`
      );

      await tokenContract.updateFees(revShareFee * 1000, liquidityFee * 1000, teamFee * 1000, burnFee * 1000);
    }

    if (swapAmount !== Number(currentSwapAmount)) {
      console.log(
        `update token swapAmount, contract current value: ${currentSwapAmount}, correct value: ${swapAmount}`
      );
      await tokenContract.updateSwapTokensAtAmount(parseEther(`${swapAmount}`));
    }

    console.log('update token contract fees done');
  }

  const GangsterNFT = await ethers.getContractFactory('Gangster');
  const nftContract = GangsterNFT.attach(nft);
  if (machine.maxPerBatch) {
    console.log('update maxPerBatch');
    const res = await nftContract.MAX_PER_BATCH();
    const currentMaxPerBatch = Number(res.toString());
    if (machine.maxPerBatch !== currentMaxPerBatch) {
      console.log(
        `updating maxPerBatch, contract current value: ${currentMaxPerBatch}, correct value: ${machine.maxPerBatch}`
      );
      await nftContract.setMaxPerBatch(machine.maxPerBatch);
    }
    console.log('update maxPerBatch done');
  }
  if (machine.maxWhitelistAmount) {
    console.log('update maxPerWL');
    const res = await nftContract.MAX_PER_WL();
    const currentMaxPerWL = Number(res.toString());
    if (machine.maxWhitelistAmount !== currentMaxPerWL) {
      console.log(
        `updating maxPerWL, contract current value: ${currentMaxPerWL}, correct value: ${machine.maxWhitelistAmount}`
      );
      await nftContract.setMaxPerWL(machine.maxWhitelistAmount);
    }
    console.log('update maxPerWL done');
  }

  const GangsterArena = await ethers.getContractFactory('GangsterArena');
  const gameContract = GangsterArena.attach(game);

  if (machine.basePrice) {
    console.log('update basePrice');
    const res = await gameContract.bPrice_();
    const currentBasePrice = Number(formatEther(res));
    if (machine.basePrice !== currentBasePrice) {
      console.log(
        `updating basePrice, contract current value: ${currentBasePrice}, correct value: ${machine.basePrice}`
      );
      await gameContract.setBasePrice(parseEther(`${machine.basePrice}`));
    }

    console.log('update basePrice done');
  }

  if (machine.whitelistPrice) {
    console.log('update basePriceWL');
    const res = await gameContract.bpwl_();
    const currentBasePriceWL = Number(formatEther(res));
    if (machine.whitelistPrice !== currentBasePriceWL) {
      console.log(
        `updating basePriceWL, contract current value: ${currentBasePriceWL}, correct value: ${machine.whitelistPrice}`
      );
      await gameContract.setBasePriceWL(parseEther(`${machine.whitelistPrice}`));
    }

    console.log('update basePriceWL done');
  }

  if (prizePool) {
    console.log('update game fees');
    const res1 = await gameContract.DEV_PERCENT();
    const res2 = await gameContract.MARKETING_PERCENT();
    const res3 = await gameContract.PRIZE_PERCENT();
    const res4 = await gameContract.RETIRE_PERCENT();

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
      await gameContract.setGameFee(
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
      const res = await gameContract.refReward_();
      const currentReferralBonus = Number(res.toString());
      if (referral.referralBonus * 10000 !== currentReferralBonus) {
        console.log(
          `updating referralBonus, contract current value: ${currentReferralBonus}, correct value: ${
            referral.referralBonus * 10000
          }`
        );
        await gameContract.setBaseReferral(referral.referralBonus * 10000);
      }
      console.log('update referral bonus done');
    }

    if (referral.referralDiscount) {
      console.log('update referral discount');
      const res = await gameContract.refDiscount_();
      const currentReferralDiscount = Number(res.toString());
      if ((1 - referral.referralDiscount) * 10000 !== currentReferralDiscount) {
        console.log(
          `updating referralDiscount, contract current value: ${currentReferralDiscount}, correct value: ${
            (1 - referral.referralDiscount) * 10000
          }`
        );
        await gameContract.setBaseReferralDiscount((1 - referral.referralDiscount) * 10000);
      }
      console.log('update referral discount done');
    }
    console.log('update referral done');
  }
  console.log('setup contract variables done');
};

async function main() {
  try {
    await deployGame();
    await configGame();
    await setupVariables();
    updateConfigs({ contractCompleted: true });
  } catch (err) {
    console.error(err);
  }

  process.exit();
}

main();
