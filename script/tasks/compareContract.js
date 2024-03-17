import { Contract } from '@ethersproject/contracts';
import { formatEther } from '@ethersproject/units';

import gameContractABI from '../assets/abis/GameContract.json' assert { type: 'json' };
import oldContractSnapshot from '../assets/jsons/oldGameContract.json' assert { type: 'json' };
import { firestore } from '../configs/admin.config.js';
import alchemy from '../configs/alchemy.config.js';

const gameContractNewAddress = '0xc01fDDe00463e2EF7F8ceDD4416f287c0b6f3AbC'; // change this to new contract address
const main = async () => {
  try {
    const { id, gameAddress } = await getActiveSeason();
    console.log(`\n\n********** Start job comparing contract ${gameAddress} and ${gameContractNewAddress}\n`);
    const oldContract = await getGameContract(gameAddress);
    const newContract = await getGameContract(gameContractNewAddress);

    const compare = async (fncName, { formatter = (a) => a, params = [] } = {}) => {
      process.stdout.write(`\tChecking ${fncName}, params: ${JSON.stringify(params)}`);
      // const oldRes = await oldContract[fncName](...params);
      const oldRes = oldContractSnapshot[fncName] || formatter(await oldContract[fncName](...params));
      const newRes = await newContract[fncName](...params);

      const isEqual = oldRes === formatter(newRes);
      // const isEqual = formatter(oldRes) === formatter(newRes);
      process.stdout.write('\r\x1b[K'); // delete status line

      if (isEqual) console.log('\t\x1b[32m', '✓ ', `Same ${fncName}, params: ${JSON.stringify(params)}`);
      else
        console.log(
          '\t\x1b[31m', // log color red
          'x ',
          `Different ${fncName}. Old contract: ${oldRes}, new contract: ${formatter(newRes)}`
        );

      process.stdout.write('\x1b[0m'); // reset log color
    };
    // 1. check contract configs
    console.log('\n\n--------1. check contract configs\n');
    console.log('Check assets address');
    await compare('nft');
    await compare('fiat');

    console.log('Check prize pool configs');
    await compare('DEV_PERCENT', { formatter: (a) => a.toString() });
    await compare('MARKETING_PERCENT', { formatter: (a) => a.toString() });
    await compare('PRIZE_PERCENT', { formatter: (a) => a.toString() });
    await compare('RETIRE_PERCENT', { formatter: (a) => a.toString() });

    console.log('Check referral configs');
    await compare('refReward_', { formatter: formatEther });
    await compare('refDiscount_', { formatter: formatEther });

    console.log('Check assets price configs');
    await compare('bPrice_', { formatter: formatEther });
    await compare('bpwl_', { formatter: formatEther });

    // 2. check contract general data
    console.log('\n\n--------2. check contract game data\n');
    console.log('Check game status');
    await compare('gameClosed');

    console.log('Check debts data');
    await compare('devDebt', { formatter: formatEther });
    await compare('marketingDebt', { formatter: formatEther });
    await compare('retireDebt', { formatter: formatEther });
    await compare('prizeDebt', { formatter: formatEther });

    console.log('Check retire data');
    await compare('tPBalance', { formatter: formatEther });
    await compare('totalPoint', { formatter: formatEther });

    console.log('Check prize pools');
    await compare('getBalance', { formatter: formatEther });
    await compare('getDevBalance', { formatter: formatEther });
    await compare('getMarketingBalance', { formatter: formatEther });
    await compare('getPrizeBalance', { formatter: formatEther });
    await compare('getRetireBalance', { formatter: formatEther });

    console.log('Check total goons & safehouse');
    await compare('tgoon', { formatter: (a) => a.toString() });
    await compare('tshouse', { formatter: (a) => a.toString() });

    // 3. check users individual data
    console.log('\n\n--------3. check users individual data\n');
    const users = await getUsersWithActiveGamePlays(id);

    for (let [index, address] of users.entries()) {
      console.log(`Checking user ${index + 1} of ${users.length}: ${address}`);
      await compare('goon', { formatter: (a) => a.toString(), params: [address] });
      await compare('safehouse', { formatter: (a) => a.toString(), params: [address] });
    }
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

const getUsersWithActiveGamePlays = async (seasonId) => {
  const userSnapshot = await firestore.collection('user').get();
  const userAddresses = {};
  userSnapshot.docs.forEach((doc) => (userAddresses[doc.id] = doc.data().address));

  const activeAddresses = [];

  const gamePlaySnapshot = await firestore.collection('gamePlay').where('seasonId', '==', seasonId).get();
  const activeGamePlay = gamePlaySnapshot.docs.filter((doc) => doc.data().active);
  activeGamePlay.forEach((doc) => {
    const userId = doc.data().userId;
    activeAddresses.push(userAddresses[userId]);
  });

  return activeAddresses;
};

main()
  .then(() => console.log(`\nDone comparing 2 contracts`))
  .then(process.exit)
  .catch((err) => console.error(err));
