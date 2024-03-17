import fs from 'fs';
import path from 'path';
import { Contract } from '@ethersproject/contracts';
import { formatEther } from '@ethersproject/units';

import gameContractABI from '../assets/abis/GameContract.json' assert { type: 'json' };
import { firestore } from '../configs/admin.config.js';
import alchemy from '../configs/alchemy.config.js';

const JSON_PATH = path.join(process.cwd(), `assets/jsons/oldGameContract.json`);

const main = async () => {
  try {
    const { gameAddress } = await getActiveSeason();
    console.log(`\n\n********** Start taking snapshot of contract ${gameAddress} x\n`);
    const currentGameContract = await getGameContract(gameAddress);
    const data = {};
    const readAndSave = async (fncName, { formatter = (a) => a, params = [] } = {}) => {
      console.log(`\tReading ${fncName}, params: ${JSON.stringify(params)}`);
      const oldRes = await currentGameContract[fncName](...params);

      data[fncName] = formatter(oldRes);
      console.log(`\tread ${fncName}`);
    };

    // 1. check contract configs
    console.log('\n\n--------1. check contract configs\n');
    console.log('Check assets address');
    await readAndSave('nft');
    await readAndSave('fiat');

    console.log('Check prize pool configs');
    await readAndSave('DEV_PERCENT', { formatter: (a) => a.toString() });
    await readAndSave('MARKETING_PERCENT', { formatter: (a) => a.toString() });
    await readAndSave('PRIZE_PERCENT', { formatter: (a) => a.toString() });
    await readAndSave('RETIRE_PERCENT', { formatter: (a) => a.toString() });

    console.log('Check referral configs');
    await readAndSave('refReward_', { formatter: formatEther });
    await readAndSave('refDiscount_', { formatter: formatEther });

    console.log('Check assets price configs');
    await readAndSave('bPrice_', { formatter: formatEther });
    await readAndSave('bpwl_', { formatter: formatEther });

    // 2. check contract general data
    console.log('\n\n--------2. check contract game data\n');
    console.log('Check game status');
    await readAndSave('gameClosed');

    console.log('Check debts data');
    await readAndSave('devDebt', { formatter: formatEther });
    await readAndSave('marketingDebt', { formatter: formatEther });
    await readAndSave('retireDebt', { formatter: formatEther });
    await readAndSave('prizeDebt', { formatter: formatEther });

    console.log('Check retire data');
    await readAndSave('tPBalance', { formatter: formatEther });
    await readAndSave('totalPoint', { formatter: formatEther });

    console.log('Check prize pools');
    await readAndSave('getBalance', { formatter: formatEther });
    await readAndSave('getDevBalance', { formatter: formatEther });
    await readAndSave('getMarketingBalance', { formatter: formatEther });
    await readAndSave('getPrizeBalance', { formatter: formatEther });
    await readAndSave('getRetireBalance', { formatter: formatEther });

    console.log('Check total goons & safehouse');
    await readAndSave('tgoon', { formatter: (a) => a.toString() });
    await readAndSave('tshouse', { formatter: (a) => a.toString() });

    console.log(`\n\n data`, data);
    fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2), 'utf8', () => {});
  } catch (err) {
    console.error(err);
  }
};

// helpers
const getActiveSeason = async () => {
  const configs = await firestore.collection('system').doc('default').get();
  const { activeSeasonId } = configs.data();

  const snapshot = await firestore.collection('season').doc(activeSeasonId).get();

  return { id: snapshot.id, ...snapshot.data() };
};

const getGameContract = async (address) => {
  const ethersProvider = await alchemy.config.getWebSocketProvider();
  const contract = new Contract(address, gameContractABI.abi, ethersProvider);

  return contract;
};

main()
  .then(() => console.log(`\nSaved contract state to ${JSON_PATH}`))
  .then(process.exit)
  .catch((err) => console.error(err));
