const configs = {
  assets: {
    machine: {
      basePrice: 0.001,
      whitelistPrice: 0.0005,
      maxWhitelistAmount: 10,
      dailyReward: 1000,
      networth: 10,
      maxPerBatch: 100,
    },
    worker: {
      basePrice: 250,
      targetDailyPurchase: 100,
      targetPrice: 2000,
      dailyReward: 400,
      networth: 2,
      maxPerBatch: 100,
    },
    building: {
      basePrice: 500,
      targetDailyPurchase: 100,
      targetPrice: 2000,
      dailyReward: 0,
      networth: 8,
      maxPerBatch: 100,
    },
  },
  prizePool: {
    rankRewardsPercent: 0.4,
    reputationRewardsPercent: 0.5,
    rewardScalingRatio: 1.25,
    // rank leaderboard
    higherRanksCutoffPercent: 0.1,
    lowerRanksCutoffPercent: 0.2,
    minRewardHigherRanks: 0.01, // in ETH
    minRewardLowerRanks: 0.005, // in ETH
    // reputation leaderboard
    earlyRetirementTax: 0.2,
    // game contract
    devFee: 0,
    marketingFee: 0.1,
  },
  war: {
    buildingBonusMultiple: 0.1,
    workerBonusMultiple: 0.1,
    earningStealPercent: 0.7,
    tokenRewardPerEarner: 1000,
    machinePercentLost: 0.05,
  },
  referral: { referralBonus: 0.1, referralDiscount: 0.1 },
  houseLevels: [
    { networthStart: 0, networthEnd: 24, level: 1 },
    { networthStart: 25, networthEnd: 49, level: 2 },
    { networthStart: 50, networthEnd: 74, level: 3 },
    { networthStart: 75, networthEnd: 99, level: 4 },
    { networthStart: 100, networthEnd: 124, level: 5 },
    { networthStart: 125, networthEnd: 149, level: 6 },
    { networthStart: 150, networthEnd: 199, level: 7 },
    { networthStart: 200, networthEnd: 249, level: 8 },
    { networthStart: 250, networthEnd: 349, level: 9 },
    { networthStart: 350, networthEnd: 499, level: 10 },
    { networthStart: 500, networthEnd: 749, level: 11 },
    { networthStart: 750, networthEnd: 1249, level: 12 },
    { networthStart: 1250, networthEnd: 1999, level: 13 },
    { networthStart: 2000, networthEnd: 4999, level: 14 },
    { networthStart: 5000, level: 15 },
  ],
  claimGapInSeconds: 120,
  timeStepInMinutes: 1, // time increase when every nft is purchased
  openseaNftCollection: 'gangster-arena', // mainnet only
  tokenContract: {
    revShareFee: 0.025,
    liquidityFee: 0.01,
    teamFee: 0.015,
    burnFee: 0,
    swapAmount: 5000,
  },
};

module.exports = configs;
