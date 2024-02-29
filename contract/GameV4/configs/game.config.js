const configs = {
  assets: {
    machine: {
      basePrice: 0.001,
      whitelistPrice: 0.0005,
      maxWhitelistAmount: 10,
      maxPerBatch: 100,
    },
  },
  prizePool: {
    rankRewardsPercent: 0.4,
    reputationRewardsPercent: 0.5,
    devFee: 0,
    marketingFee: 0.1,
  },
  referral: { referralBonus: 0.1, referralDiscount: 0.1 },
};

module.exports = configs;
