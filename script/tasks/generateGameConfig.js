import fs from 'fs';
import path from 'path';

import environments from '../utils/environments.js';
import { sheets } from '../configs/google.config.js';

const { GAME_CONFIG_SPREADSHEET_ID, GAME_CONFIG_SPREADSHEET_COLUMN: col } = environments;

// helpers
const getDecimalFromPercentString = (percentString) => {
  if (percentString.includes('%')) return Number(percentString.replace('%', '')) / 100;
  else return Number(percentString); // if it's already decimal string like '0.001'
};

// configs
const JSON_PATH = path.join(process.cwd(), `configs/game.config.json`);
const JSON_PATH_CONTRACT = path.join(process.cwd(), '../contract/GameV5-Blast/configs/game.config.json');
const columnIndex = col.toUpperCase().charCodeAt(0) - 65;

const houseLevels = [
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
];

const spinRewards = [
  { type: 'house', value: 1, order: 1, percentage: 0.26 },
  { type: 'house', value: 2, order: 2, percentage: 0.13 },
  { type: 'house', value: 3, order: 3, percentage: 0.07 },
  { type: 'house', value: 5, order: 4, percentage: 0.03 },
  { type: 'house', value: 10, order: 5, percentage: 0.009 },
  { type: 'house', value: 50, order: 6, percentage: 0.001 },
  { type: 'point', value: 10, order: 7, percentage: 0.01 },
  { type: 'point', value: 50, order: 8, percentage: 0.03 },
  { type: 'point', value: 100, order: 9, percentage: 0.07 },
  { type: 'point', value: 250, order: 10, percentage: 0.15 },
  { type: 'point', value: 500, order: 11, percentage: 0.13 },
  { type: 'point', value: 1000, order: 12, percentage: 0.07 },
  { type: 'point', value: 2500, order: 13, percentage: 0.03 },
  { type: 'point', value: 10000, order: 14, percentage: 0.009 },
  { type: 'point', value: 50000, order: 15, percentage: 0.001 },
];

const ROW_STRUCTURE = {
  assets: {
    machine: {
      basePrice: { row: 2, formatter: Number },
      whitelistPrice: { row: 3, formatter: Number },
      maxPerBatch: { row: 4, formatter: Number },
      maxWhitelistAmount: { row: 5, formatter: Number },
      dailyReward: { row: 6, formatter: Number },
      networth: { row: 7, formatter: Number },
      earningRateIncrementPerLevel: { row: 8, formatter: Number },
    },
    worker: {
      basePrice: { row: 10, formatter: Number },
      dailyReward: { row: 11, formatter: Number },
      networth: { row: 12, formatter: Number },
      targetDailyPurchase: { row: 13, formatter: Number },
      targetPrice: { row: 14, formatter: Number },
      maxPerBatch: { row: 15, formatter: Number },
    },
    building: {
      basePrice: { row: 17, formatter: Number },
      dailyReward: { row: 18, formatter: Number },
      networth: { row: 19, formatter: Number },
      targetDailyPurchase: { row: 20, formatter: Number },
      targetPrice: { row: 21, formatter: Number },
      maxPerBatch: { row: 22, formatter: Number },
    },
  },
  referral: { referralBonus: { row: 25, formatter: Number }, referralDiscount: { row: 26, formatter: Number } },
  prizePool: {
    earlyRetirementTax: { row: 28, formatter: Number },
    rankRewardsPercent: { row: 29, formatter: Number },
    reputationRewardsPercent: { row: 30, formatter: Number },
    rewardScalingRatio: { row: 31, formatter: Number },
    // rank leaderboard
    higherRanksCutoffPercent: { row: 32, formatter: Number },
    lowerRanksCutoffPercent: { row: 33, formatter: Number },
    minRewardHigherRanks: { row: 34, formatter: Number }, // in ETH
    minRewardLowerRanks: { row: 35, formatter: Number }, // in ETH
    // game contract
    devFee: { row: 60, formatter: getDecimalFromPercentString },
    marketingFee: { row: 61, formatter: getDecimalFromPercentString },
  },
  war: {
    buildingBonusMultiple: { row: 37, formatter: Number },
    workerBonusMultiple: { row: 38, formatter: Number },
    earningStealPercent: { row: 39, formatter: Number },
    tokenRewardPerEarner: { row: 40, formatter: Number },
    machinePercentLost: { row: 41, formatter: Number },
  },
  initGameDurationInDays: { row: 45, formatter: Number },
  endTimeConfig: {
    timeIncrementInSeconds: { row: 69, formatter: Number },
    timeDecrementInSeconds: { row: 70, formatter: Number },
  },
  claimGapInSeconds: { row: 47, formatter: Number },
  openseaNftCollection: { row: 49, formatter: null },
  swapXTokenGapInSeconds: { row: 73, formatter: Number },
  tokenContract: {
    liquidityFee: { row: 52, formatter: getDecimalFromPercentString },
    teamFee: { row: 53, formatter: getDecimalFromPercentString },
    burnFee: { row: 54, formatter: getDecimalFromPercentString },
    revShareFee: { row: 55, formatter: getDecimalFromPercentString },
    swapAmount: { row: 57, formatter: Number },
  },
  initPurchased: {
    worker: { row: 64, formatter: Number },
    building: { row: 65, formatter: Number },
  },
  spinConfig: {
    spinIncrementStep: { row: 77, formatter: Number },
    maxSpin: { row: 78, formatter: Number },
  },
};

const main = async () => {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: GAME_CONFIG_SPREADSHEET_ID,
    range: 'sheet2!A1:100',
  });
  const rows = res.data.values;

  if (!rows || rows.length === 0) {
    console.log('No data found from sheet.');
    return;
  }

  const getRowValue = ({ row, formatter }) => {
    const index = row - 1;
    const value = rows[index][columnIndex];
    if (!value) throw new Error(`No data for ${rows[index][0]}! Empty cell found at cell ${col}${row}`);

    if (formatter && isNaN(formatter(value))) throw new Error(`Invalid value at cell ${col}${row}: Must be a number`);

    return formatter ? formatter(value) : value;
  };
  const generateConfigFromObject = (obj) => {
    if (obj.row) return getRowValue(obj);

    const result = {};
    for (let key in obj) {
      result[key] = generateConfigFromObject(obj[key]);
    }

    return result;
  };

  const generatedConfig = { ...generateConfigFromObject(ROW_STRUCTURE), houseLevels };
  generatedConfig.spinConfig.spinRewards = spinRewards;
  console.log('generatedConfig:', generatedConfig);

  // check sum of prize pool distribution
  const { rankRewardsPercent, reputationRewardsPercent, devFee, marketingFee } = generatedConfig.prizePool;
  if (rankRewardsPercent + reputationRewardsPercent + devFee + marketingFee !== 1) {
    const {
      rankRewardsPercent: rankPercentConfig,
      reputationRewardsPercent: reputationPercentConfig,
      devFee: devPercentConfig,
      marketingFee: marketingPercentConfig,
    } = ROW_STRUCTURE.prizePool;
    throw new Error(
      `Invalid config! Sum of rewards distribution must be 100%. Check cells: ${col}${rankPercentConfig.row}, ${col}${reputationPercentConfig.row}, ${col}${devPercentConfig.row}, ${col}${marketingPercentConfig.row}`
    );
  }

  fs.writeFileSync(JSON_PATH, JSON.stringify(generatedConfig, null, 2), 'utf8', () => {});
  fs.writeFileSync(JSON_PATH_CONTRACT, JSON.stringify(generatedConfig, null, 2), 'utf8', () => {});
};

main()
  .then(() => console.log(`\nDone writing game config to:\n${JSON_PATH} \nand \n${JSON_PATH_CONTRACT}`))
  .then(process.exit)
  .catch((err) => console.error(err));
