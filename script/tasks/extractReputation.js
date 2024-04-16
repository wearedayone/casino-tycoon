import { firestore } from '../configs/admin.config.js';
import fs from 'fs';

const extractRep = async ({ userId, username, address, blocks }) => {
  const gamePlay = await firestore
    .collection('gamePlay')
    .where('userId', '==', userId)
    .where('seasonId', '==', 'ZteHVCoKgpnMvg1tHTfj')
    .limit(1)
    .get();
  if (gamePlay.empty) return;
  const { numberOfMachines, numberOfBuildings, numberOfWorkers } = gamePlay.docs[0].data();
  const transactionSnapshot = await firestore
    .collection('transaction')
    .where('userId', '==', userId)
    .where('seasonId', '==', 'ZteHVCoKgpnMvg1tHTfj')
    .where('status', '==', 'Success')
    .orderBy('createdAt')
    .get();
  if (transactionSnapshot.empty) return;

  const txnDatas = transactionSnapshot.docs
    .map((doc) => {
      const { type, createdAt, amount, machinesDeadCount } = doc.data();
      return { type, createdAt, amount, machinesDeadCount };
    })
    .filter(
      (txn) =>
        txn.type === 'buy-building' ||
        txn.type === 'buy-worker' ||
        txn.type === 'buy-machine' ||
        txn.type === 'deposit-machine' ||
        txn.type === 'withdraw-machine' ||
        txn.type === 'retire' ||
        txn.type === 'war-penalty'
    );
  let rep = 2;
  let gangster = 0;
  let goon = 1;
  let safehouse = 0;
  const user = {
    username,
    address,
    reputation: [{ time: blocks[0], rep: rep, gangster: gangster, goon: goon, safehouse: safehouse }],
  };
  user[blocks[0]] = rep;
  for (let i = 0; i < blocks.length - 2; i++) {
    // console.log({ start: blocks[i], end: blocks[i + 1], ss: txnDatas[0].createdAt.toDate().getTime() / 1000 });
    const txns = txnDatas.filter(
      (txn) =>
        txn.createdAt.toDate().getTime() / 1000 >= blocks[i] && txn.createdAt.toDate().getTime() / 1000 < blocks[i + 1]
    );

    for (const txn of txns) {
      if (txn.type === 'buy-building') {
        safehouse += txn.amount;
        rep += 8 * txn.amount;
      } else if (txn.type === 'buy-worker') {
        goon += txn.amount;
        rep += 2 * txn.amount;
      } else if (txn.type === 'buy-machine') {
        gangster += txn.amount;
        rep += 10 * txn.amount;
      } else if (txn.type === 'deposit-machine') {
        gangster += txn.amount;
        rep += 10 * txn.amount;
      } else if (txn.type === 'withdraw-machine') {
        gangster -= txn.amount;
        rep -= 10 * txn.amount;
      } else if (txn.type === 'retire') {
        gangster = goon = safehouse = 0;
        rep = 0;
      } else if (txn.type === 'war-penalty') {
        gangster -= txn.machinesDeadCount;
        rep -= 10 * txn.machinesDeadCount;
      }
    }

    user.reputation.push({ time: blocks[i + 1], rep: rep, gangster: gangster, goon: goon, safehouse: safehouse });
    user[blocks[i + 1]] = rep;
  }
  user.reputation.push({
    time: blocks[blocks.length - 1],
    rep: numberOfMachines * 10 + numberOfBuildings * 8 + numberOfWorkers * 2,
    gangster: numberOfMachines,
    goon: numberOfWorkers,
    safehouse: numberOfBuildings,
  });
  user[blocks[blocks.length - 1]] = numberOfMachines * 10 + numberOfBuildings * 8 + numberOfWorkers * 2;

  const { reputation, ...data } = user;
  console.log(data);
  return data;
  //   for()
};

const generateDateBlocks = () => {
  const start = 1710374400;
  const endTime = 1712048400;
  const duration = 60 * 60 * 6;
  const blocks = [];
  let current = start;
  blocks.push(current);
  while (current + duration <= endTime) {
    current += duration;
    blocks.push(current);
  }
  blocks.push(endTime);

  return blocks;
};

const main = async () => {
  console.log(`start extract reputation `);

  const userSnapshot = await firestore.collection('user').get();

  if (userSnapshot.empty) return;
  const blocks = generateDateBlocks();
  const repData = [];
  for (const userDoc of userSnapshot.docs) {
    const data = userDoc.data();
    const user = await extractRep({ ...data, userId: userDoc.id, blocks });
    if (user) {
      repData.push(user);
    }
  }
  fs.writeFileSync('userRep.json', JSON.stringify(repData, null, 2), 'utf8', () => {});
};

main()
  .then(process.exit)
  .catch((err) => console.error(err));
