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
  {
    type: 'house',
    value: 1,
    order: 1,
    percentage: 0.2,
    iconImg: 'spin-reward-house-1',
    containerImg: 'spin-container-1',
  },
  {
    type: 'house',
    value: 2,
    order: 2,
    percentage: 0.08,
    iconImg: 'spin-reward-house-2',
    containerImg: 'spin-container-2',
  },
  {
    type: 'house',
    value: 3,
    order: 3,
    percentage: 0.04,
    iconImg: 'spin-reward-house-3',
    containerImg: 'spin-container-3',
  },
  {
    type: 'house',
    value: 5,
    order: 4,
    percentage: 0.009,
    iconImg: 'spin-reward-house-4',
    containerImg: 'spin-container-4',
  },
  {
    type: 'house',
    value: 20,
    order: 5,
    percentage: 0.001,
    iconImg: 'spin-reward-house-5',
    containerImg: 'spin-container-5',
  },
  {
    type: 'GANG',
    value: 100,
    order: 6,
    percentage: 0.05,
    iconImg: 'spin-reward-token-1',
    containerImg: 'spin-container-1',
  },
  {
    type: 'GANG',
    value: 300,
    order: 7,
    percentage: 0.13,
    iconImg: 'spin-reward-token-1',
    containerImg: 'spin-container-1',
  },
  {
    type: 'GANG',
    value: 400,
    order: 8,
    percentage: 0.28,
    iconImg: 'spin-reward-token-1',
    containerImg: 'spin-container-1',
  },
  {
    type: 'GANG',
    value: 500,
    order: 9,
    percentage: 0.1,
    iconImg: 'spin-reward-token-1',
    containerImg: 'spin-container-1',
  },
  {
    type: 'GANG',
    value: 800,
    order: 10,
    percentage: 0.07,
    iconImg: 'spin-reward-token-2',
    containerImg: 'spin-container-2',
  },
  {
    type: 'GANG',
    value: 1500,
    order: 11,
    percentage: 0.027,
    iconImg: 'spin-reward-token-3',
    containerImg: 'spin-container-3',
  },
  {
    type: 'GANG',
    value: 4500,
    order: 12,
    percentage: 0.009,
    iconImg: 'spin-reward-token-4',
    containerImg: 'spin-container-4',
  },
  {
    type: 'GANG',
    value: 10000,
    order: 13,
    percentage: 0.003,
    iconImg: 'spin-reward-token-5',
    containerImg: 'spin-container-4',
  },
  {
    type: 'GANG',
    value: 50000,
    order: 14,
    percentage: 0.001,
    iconImg: 'spin-reward-token-6',
    containerImg: 'spin-container-5',
  },
];

const ROW_STRUCTURE = {
  assets: {
    machine: {
      basePrice: { row: 3, formatter: Number },
      whitelistPrice: { row: 4, formatter: Number },
      maxPerBatch: { row: 5, formatter: Number },
      maxWhitelistAmount: { row: 6, formatter: Number },
      dailyReward: { row: 7, formatter: Number },
      networth: { row: 8, formatter: Number },
      earningRateIncrementPerLevel: { row: 9, formatter: Number },
      targetDailyPurchase: { row: 10, formatter: Number },
      targetPrice: { row: 11, formatter: Number },
      // pricePower: { row: 12, formatter: Number },
    },
    worker: {
      basePrice: { row: 19, formatter: Number },
      maxPerBatch: { row: 20, formatter: Number },
      dailyReward: { row: 21, formatter: Number },
      networth: { row: 22, formatter: Number },
      targetDailyPurchase: { row: 23, formatter: Number },
      targetPrice: { row: 24, formatter: Number },
      // pricePower: { row: 25, formatter: Number },
    },
    building: {
      basePrice: { row: 32, formatter: Number },
      maxPerBatch: { row: 33, formatter: Number },
      dailyReward: { row: 34, formatter: Number },
      networth: { row: 35, formatter: Number },
      targetDailyPurchase: { row: 36, formatter: Number },
      targetPrice: { row: 37, formatter: Number },
      // pricePower: { row: 38, formatter: Number },
      initMachineCapacity: { row: 39, formatter: Number },
      machineCapacityIncrementPerLevel: { row: 40, formatter: Number },
    },
  },
  initGameDurationInDays: { row: 48, formatter: Number },
  claimGapInSeconds: { row: 49, formatter: Number },
  swapXTokenGapInSeconds: { row: 50, formatter: Number },
  endTimeConfig: {
    timeIncrementInSeconds: { row: 57, formatter: Number },
    timeDecrementInSeconds: { row: 58, formatter: Number },
  },
  spinConfig: {
    spinIncrementStep: { row: 63, formatter: Number },
    maxSpin: { row: 64, formatter: Number },
  },
  referral: { referralBonus: { row: 70, formatter: Number }, referralDiscount: { row: 71, formatter: Number } },

  prizePool: {
    earlyRetirementTax: { row: 78, formatter: Number },
    rankRewardsPercent: { row: 79, formatter: Number },
    reputationRewardsPercent: { row: 80, formatter: Number },
    rewardScalingRatio: { row: 81, formatter: Number },
    // rank leaderboard
    higherRanksCutoffPercent: { row: 82, formatter: Number },
    lowerRanksCutoffPercent: { row: 83, formatter: Number },
    minRewardHigherRanks: { row: 84, formatter: Number }, // in ETH
    minRewardLowerRanks: { row: 85, formatter: Number }, // in ETH
    // game contract
    devFee: { row: 132, formatter: getDecimalFromPercentString },
    marketingFee: { row: 133, formatter: getDecimalFromPercentString },
  },
  war: {
    buildingBonusMultiple: { row: 92, formatter: Number },
    workerBonusMultiple: { row: 93, formatter: Number },
    earningStealPercent: { row: 94, formatter: Number },
    tokenRewardPerEarner: { row: 95, formatter: Number },
    machinePercentLost: { row: 96, formatter: Number },
  },
  openseaNftCollection: { row: 102, formatter: null },
  tokenContract: {
    liquidityFee: { row: 112, formatter: getDecimalFromPercentString },
    teamFee: { row: 113, formatter: getDecimalFromPercentString },
    burnFee: { row: 114, formatter: getDecimalFromPercentString },
    revShareFee: { row: 115, formatter: getDecimalFromPercentString },
    swapAmount: { row: 117, formatter: Number },
  },
  initPurchased: {
    worker: { row: 121, formatter: Number },
    building: { row: 122, formatter: Number },
  },
};

const main = async () => {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: GAME_CONFIG_SPREADSHEET_ID,
    range: 'sheet2!A1:150',
  });
  const rows = res.data.values;

  if (!rows || rows.length === 0) {
    console.log('No data found from sheet.');
    return;
  }

  const getRowValue = ({ row, formatter }) => {
    // console.log({ row, data: rows[row - 1], next: rows[row], next1: rows[row + 1], columnIndex });
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
