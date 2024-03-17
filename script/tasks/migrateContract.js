import { firestore } from '../configs/admin.config.js';
import fs from 'fs';
import { Contract } from '@ethersproject/contracts';
import * as ethers from 'ethers';
import alchemy, { getCustomAlchemy } from '../configs/alchemy.config.js';
import gaABI from '../assets/abis/GameContract.json' assert { type: 'json' };
import gaABINew from '../assets/abis/GameContractNew.json' assert { type: 'json' };
import { formatEther, parseEther } from 'ethers/lib/utils.js';
import environments from '../utils/environments.js';
import { PassThrough } from 'stream';
const adminWalletAddr = '0x7866Ac3933dCA99b2e9a80F8948344a387a7BF62';
const { WALLET_PRIVATE_KEY } = environments;

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const getGAContract = async (addr, abi) => {
  const provider = await alchemy.config.getProvider();
  const contract = new Contract(addr, abi, provider);
  return contract;
};

const exportUserAddress = async (seasonId, filename) => {
  console.log('Start export user data');
  const userSnapshot = await firestore.collection('user').get();
  const gp = await firestore.collection('gamePlay').where('active', '==', true).where('seasonId', '==', seasonId).get();
  if (gp.empty || userSnapshot.empty) {
    return;
  }
  const listIds = gp.docs.map((doc) => doc.data().userId);

  const totalUserData = userSnapshot.docs
    .map((doc) => ({ userId: doc.id, address: doc.data().address }))
    .filter((u) => listIds.includes(u.userId));

  for (let i = 0; i < totalUserData.length; i++) {
    const gdoc = gp.docs.find((d) => d.data().userId == totalUserData[i].userId);
    const { numberOfWorkers, numberOfBuildings } = gdoc.data();
    totalUserData[i].dbGoon = numberOfWorkers;
    totalUserData[i].dbSafehouse = numberOfBuildings;
  }

  //   console.log(totalUserData.length, totalUserData);
  fs.writeFileSync(`assets/jsons/${filename}`, JSON.stringify(totalUserData, null, 2), { encoding: 'utf-8' });
};

const exportGameData = async (addr, input, output) => {
  let checking = true;
  while (checking) {
    console.log('Checking export user data completed');
    if (fs.existsSync(`assets/jsons/${input}`)) {
      checking = false;
    } else {
      await sleep(2000);
    }
  }
  console.log('Start export data of old contract');

  const configs = fs.readFileSync(`assets/jsons/${input}`, { encoding: 'utf-8' });
  const listUsers = JSON.parse(configs);
  const gaContract = await getGAContract(addr, gaABI.abi);
  const provider = await alchemy.config.getProvider();
  const oldData = {};
  oldData.ETHBalance = formatEther(await provider.getBalance(addr));
  //Address
  oldData.fiat = await gaContract.fiat();
  oldData.nft = await gaContract.nft();
  //   oldData.signer = formatEther(await gaContract.signer());

  //price
  oldData.basePrice = formatEther(await gaContract.bPrice_());
  oldData.basePriceWL = formatEther(await gaContract.bpwl_());

  //Debt
  oldData.devDebt = await gaContract.devDebt();
  oldData.marketingDebt = await gaContract.marketingDebt();
  oldData.retireDebt = await gaContract.retireDebt();
  oldData.prizeDebt = await gaContract.prizeDebt();

  //gameClosed
  oldData.gameClosed = await gaContract.gameClosed();

  //Ref config
  oldData.refReward_ = formatEther(await gaContract.refReward_());
  oldData.refDiscount_ = formatEther(await gaContract.refDiscount_());

  //Prize config
  oldData.DEV_PERCENT = formatEther(await gaContract.DEV_PERCENT());
  oldData.MARKETING_PERCENT = formatEther(await gaContract.MARKETING_PERCENT());
  oldData.PRIZE_PERCENT = formatEther(await gaContract.PRIZE_PERCENT());
  oldData.RETIRE_PERCENT = formatEther(await gaContract.RETIRE_PERCENT());

  //vtd
  oldData.vtd = formatEther(await gaContract.vtd());

  //Total Goon & SafeHouse
  oldData.tgoon = formatEther(await gaContract.tgoon());
  oldData.tshouse = formatEther(await gaContract.tshouse());

  //   //Reputation
  //   oldData.rpGangster = formatEther(await gaContract.rpGangster());
  //   oldData.rpGoon = formatEther(await gaContract.rpGoon());
  //   oldData.rpSHouse = formatEther(await gaContract.rpSHouse());

  //   //retireTax
  //   oldData.retireTax = formatEther(await gaContract.retireTax());

  //end game point
  oldData.tPBalance = formatEther(await gaContract.tPBalance());
  oldData.totalPoint = formatEther(await gaContract.totalPoint());

  //GameBalance
  oldData.totalBalance = formatEther(await gaContract.getBalance());
  oldData.DevBalance = formatEther(await gaContract.getDevBalance());
  oldData.MarketingBalance = formatEther(await gaContract.getMarketingBalance());
  oldData.RetireBalance = formatEther(await gaContract.getRetireBalance());
  oldData.PrizeBalance = formatEther(await gaContract.getPrizeBalance());
  let users = [];
  let tGoon = parseEther('0');
  let tSafeHouse = parseEther('0');
  const listRetired = ['0x72560bf96f4a8f28e21530d19f7e28d6a379fd1f'];
  for (const user of listUsers) {
    const address = user?.address;
    if (!address) continue;
    if (listRetired.includes(address)) continue;
    user.goon = formatEther(await gaContract.goon(address));
    user.safehouse = formatEther(await gaContract.safehouse(address));
    tGoon = tGoon.add(parseEther(user.goon));
    tSafeHouse = tSafeHouse.add(parseEther(user.safehouse));

    users.push(user);
    // console.log({ users });
  }
  oldData.tgoonNew = formatEther(tGoon);
  oldData.tshouseNew = formatEther(tSafeHouse);
  oldData.users = users;
  console.log({
    tGoon: formatEther(tGoon),
    tSafeHouse: formatEther(tSafeHouse),
    oldTGoon: oldData.tgoon,
    oldTSHouse: oldData.tshouse,
  });

  fs.writeFileSync(`assets/jsons/${output}`, JSON.stringify(oldData, null, 2), { encoding: 'utf-8' });
};

const importNewGameData = async (addr, filename) => {
  console.log('Start import data to new contract');
  const gameDataStr = fs.readFileSync(`assets/jsons/${filename}`, { encoding: 'utf-8' });
  const gameData = JSON.parse(gameDataStr);
  const ethersProvider = await alchemy.config.getProvider();
  const adminWallet = new ethers.Wallet(WALLET_PRIVATE_KEY, ethersProvider);
  const gaContract = new Contract(addr, gaABINew.abi, adminWallet);
  let gasPrice = await ethersProvider.getGasPrice();

  const currentETHBalance = await ethersProvider.getBalance(addr);
  const oldBETHBalance = parseEther(gameData.ETHBalance);
  if (currentETHBalance != oldBETHBalance) {
    const diff = oldBETHBalance.sub(currentETHBalance);
    if (diff > 0) {
      console.log('send eth', formatEther(diff));
      await adminWallet.sendTransaction({
        from: adminWalletAddr,
        to: addr,
        data: '0x',
        value: diff,
      });
    } else console.log('dont need to send eth');
  }
  console.log('Start update game data');
  const _devDebt = gameData.devDebt.hex.startsWith('-')
    ? BigInt(gameData.devDebt.hex.substring(1)) * BigInt(-1)
    : BigInt(gameData.devDebt.hex);

  const _marketingDebt = gameData.marketingDebt.hex.startsWith('-')
    ? BigInt(gameData.marketingDebt.hex.substring(1)) * BigInt(-1)
    : BigInt(gameData.marketingDebt.hex);

  const _retireDebt = gameData.retireDebt.hex.startsWith('-')
    ? BigInt(gameData.retireDebt.hex.substring(1)) * BigInt(-1)
    : BigInt(gameData.retireDebt.hex);

  const _prizeDebt = gameData.prizeDebt.hex.startsWith('-')
    ? BigInt(gameData.prizeDebt.hex.substring(1)) * BigInt(-1)
    : BigInt(gameData.prizeDebt.hex);

  gasPrice = await ethersProvider.getGasPrice();
  await gaContract.migrateData(
    _devDebt,
    _marketingDebt,
    _retireDebt,
    _prizeDebt,
    parseEther(gameData.tgoonNew),
    parseEther(gameData.tshouseNew),
    { gasPrice }
  );

  // Migrate user:
  console.log('Start update user data');
  const users = gameData.users;
  let i = 0;
  let batch = 10;
  while (i < users.length) {
    const currentBatch = users.slice(i, batch);
    const addresses = currentBatch.map((u) => u.address);
    const goons = currentBatch.map((u) => parseEther(u.goon));
    const safehouses = currentBatch.map((u) => parseEther(u.safehouse));
    gasPrice = await ethersProvider.getGasPrice();
    await gaContract.migrateGoon(addresses, goons, 1, { gasPrice });
    await gaContract.migrateGoon(addresses, safehouses, 2, { gasPrice });
    i += batch;
  }
};

const main = async () => {
  const oldGame = '0x9880ac162e4108364b5076a426D0fa1f681ED0BD';
  const newGame = '0x1BD4b8cc71d90878b404B6DAd70abD814eC49622';
  const seasonId = 'TXwJnlfpLlPhhQN2OIOh';

  await exportUserAddress(seasonId, '_listUsers_STG.json');
  await exportGameData(oldGame, '_listUsers_STG.json', '_oldData_STG.json');
  await importNewGameData(newGame, '_oldData_STG.json');
  await exportGameData(newGame, '_listUsers_STG.json', '_newData_STG.json');

  //   const oldGame = '0x5e62Dd7D4008fD8A9dA051B845d254C3e34E0503';
  //   //   const newGame = '0x5F74D054B07a6c3f9A4f39bA15FA193550e370fd';
  //   const seasonId = 'ZteHVCoKgpnMvg1tHTfj';

  //   await exportUserAddress(seasonId, '_listUsers_PRD.json');
  //   await exportGameData(oldGame, '_listUsers_PRD.json', '_oldData_PRD.json');
  //   //   await importNewGameData(newGame, '_oldData_STG.json');
  //   //   await exportGameData(newGame, '_listUsers_STG.json', '_newData_STG.json');
};

main()
  .then(() => console.log('done'))
  .catch((err) => console.error(err));
