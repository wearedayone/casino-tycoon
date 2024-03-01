import fs from 'fs';
import path from 'path';

import environments from '../utils/environments.js';
import { sheets } from '../configs/google.config.js';

const { ENVIRONMENT, GAME_CONFIG_SPREADSHEET_ID } = environments;

// helpers
const getColIndexFromColumn = (string) => string.charCodeAt(0) - 65;

const getDecimalFromPercentString = (percentString) => {
  if (percentString.includes('%')) return Number(percentString.replace('%', '')) / 100;
  else return Number(percentString); // if it's already decimal string like '0.001'
};

// configs
const JSON_PATH = path.join(process.cwd(), `configs/game.config.json`);
const columnIndex = {
  production: getColIndexFromColumn('F'),
  staging: getColIndexFromColumn('D'),
  dev: getColIndexFromColumn('C'),
};

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

const ROW_STRUCTURE = {
  assets: {
    machine: {
      basePrice: { row: 2, formatter: Number },
      whitelistPrice: { row: 3, formatter: Number },
      maxPerBatch: { row: 4, formatter: Number },
      maxWhitelistAmount: { row: 5, formatter: Number },
      dailyReward: { row: 6, formatter: Number },
      networth: { row: 7, formatter: Number },
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
  timeStepInMinutes: { row: 46, formatter: Number }, // time increase when every nft is purchased
  claimGapInSeconds: { row: 47, formatter: Number },
  openseaNftCollection: { row: 49, formatter: null },
  tokenContract: {
    liquidityFee: { row: 52, formatter: getDecimalFromPercentString },
    teamFee: { row: 53, formatter: getDecimalFromPercentString },
    burnFee: { row: 54, formatter: getDecimalFromPercentString },
    revShareFee: { row: 55, formatter: getDecimalFromPercentString },
    swapAmount: { row: 57, formatter: Number },
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
    const value = rows[index][columnIndex[ENVIRONMENT]] || rows[index][columnIndex.production];

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
  console.log('generatedConfig:', generatedConfig);

  fs.writeFileSync(JSON_PATH, JSON.stringify(generatedConfig, null, 2), 'utf8', () => {});
};

main()
  .then(() => console.log(`done writing game config to ${JSON_PATH}`))
  .then(process.exit)
  .catch((err) => console.error(err));
