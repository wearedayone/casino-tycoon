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
  const gameContract = await GangsterArena.deploy(
    defaultAdmin,
    admin,
    worker,
    signer,
    nft,
    token,
    admin,
    '0x2fc95838c71e76ec69ff817983BFf17c710F34E0'
  );
  const gameAddress = await gameContract.getAddress();

  await verifyContract({
    address: gameAddress,
    constructorArguments: [
      defaultAdmin,
      admin,
      worker,
      signer,
      nft,
      token,
      admin,
      '0x2fc95838c71e76ec69ff817983BFf17c710F34E0',
    ],
  });

  updateConfigs({ game: gameAddress, gameDeployed: true });
  console.log(`Game is deployed to ${gameAddress}`);
};

const configGame = async () => {
  console.log('Configs game...');
  const { token, nft, game, pair, uniRouter } = readConfigs();

  const FIAT = await ethers.getContractFactory('GREED');
  const fiatToken = FIAT.attach(token);
  const minterRole = await fiatToken.MINTER_ROLE();
  await fiatToken.grantRole(minterRole, game);

  await fiatToken.updateUniswapAddresses(pair, uniRouter);
  await fiatToken.updateGangsterArenaAddress(game);

  const NFT = await ethers.getContractFactory('Gangster');
  const nftContract = NFT.attach(nft);
  await nftContract.setTokenMaxSupply([0, 1000000]);

  const nftMinterRole = await nftContract.MINTER_ROLE();
  await nftContract.grantRole(nftMinterRole, game);
  console.log('Configs game done');
};

const configGameNewContract = async () => {
  console.log('Configs game...');
  const { token, nft, game, pair, uniRouter } = readConfigs();

  const FIAT = await ethers.getContractFactory('GREED');
  const fiatToken = FIAT.attach(token);
  const minterRole = await fiatToken.MINTER_ROLE();
  await fiatToken.grantRole(minterRole, game);

  await fiatToken.updateGangsterArenaAddress(game);

  const NFT = await ethers.getContractFactory('Gangster');
  const nftContract = NFT.attach(nft);

  const nftMinterRole = await nftContract.MINTER_ROLE();
  await nftContract.grantRole(nftMinterRole, game);
  console.log('Configs game done');
};

const setupVariables = async () => {
  console.log('setup contract variables...');
  const { token, nft, game } = readConfigs();
  const FIAT = await ethers.getContractFactory('GREED');
  const tokenContract = FIAT.attach(token);
  if (tokenContractVariables) {
    console.log('update token contract fees');
    const res1 = await tokenContract.prizeFee();
    const res2 = await tokenContract.liquidityFee();
    const res3 = await tokenContract.devFee();
    const res4 = await tokenContract.burnFee();
    const res5 = await tokenContract.swapTokensAtAmount();

    const currentRevShareFee = Number(res1.toString());
    const currentLiquidityFee = Number(res2.toString());
    const currentTeamFee = Number(res3.toString());
    const currentBurnFee = Number(res4.toString());
    const currentSwapAmount = formatEther(res5.toString());
    const { revShareFee, liquidityFee, teamFee, burnFee, swapAmount } = tokenContractVariables;

    if (
      revShareFee * 10000 !== currentRevShareFee ||
      liquidityFee * 10000 !== currentLiquidityFee ||
      teamFee * 10000 !== currentTeamFee ||
      burnFee * 10000 !== currentBurnFee
    ) {
      console.log(
        `update token contract fees, contract current value: ${JSON.stringify({
          revShare: currentRevShareFee,
          liquidity: currentLiquidityFee,
          team: currentTeamFee,
          burn: currentBurnFee,
        })}, correct value: ${JSON.stringify({
          revShare: revShareFee * 10000,
          liquidity: liquidityFee * 10000,
          team: teamFee * 10000,
          burn: burnFee * 10000,
        })}`
      );

      await tokenContract.updateFees(revShareFee * 10000, liquidityFee * 10000, teamFee * 10000, burnFee * 10000, 5000);
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

  // if (referral) {
  //   console.log('update referral');
  //   if (referral.referralBonus) {
  //     console.log('update referral bonus');
  //     const res = await gameContract.refReward_();
  //     const currentReferralBonus = Number(res.toString());
  //     if (referral.referralBonus * 10000 !== currentReferralBonus) {
  //       console.log(
  //         `updating referralBonus, contract current value: ${currentReferralBonus}, correct value: ${
  //           referral.referralBonus * 10000
  //         }`
  //       );
  //       await gameContract.setBaseReferral(referral.referralBonus * 10000);
  //     }
  //     console.log('update referral bonus done');
  //   }

  //   if (referral.referralDiscount) {
  //     console.log('update referral discount');
  //     const res = await gameContract.refDiscount_();
  //     const currentReferralDiscount = Number(res.toString());
  //     if ((1 - referral.referralDiscount) * 10000 !== currentReferralDiscount) {
  //       console.log(
  //         `updating referralDiscount, contract current value: ${currentReferralDiscount}, correct value: ${
  //           (1 - referral.referralDiscount) * 10000
  //         }`
  //       );
  //       await gameContract.setBaseReferralDiscount((1 - referral.referralDiscount) * 10000);
  //     }
  //     console.log('update referral discount done');
  //   }
  //   console.log('update referral done');
  // }
  console.log('setup contract variables done');
};

async function main() {
  try {
    await deployGame();
    // await configGameNewContract();
    await configGame();
    await setupVariables();
    updateConfigs({ contractCompleted: true });
  } catch (err) {
    console.error(err);
  }

  process.exit();
}

main();
