import moment from 'moment';
// import fs from 'fs';

import admin, { firestore } from '../configs/admin.config.js';

const getActiveSeason = async () => {
  const configs = await firestore.collection('system').doc('default').get();
  const { activeSeasonId } = configs.data();

  const snapshot = await firestore.collection('season').doc(activeSeasonId).get();

  return { id: snapshot.id, ...snapshot.data() };
};

// user id, wallet, twitter name, number of transactions, fiat generation, eth spend
const extractUser = async () => {
  try {
    const activeSeason = await getActiveSeason();

    if (!activeSeason) return;

    const { id: seasonId } = activeSeason;
    const endTime = moment().utc().startOf('day').toDate().getTime();
    const startTime = endTime - 24 * 60 * 60 * 1000;
    const endTimestamp = admin.firestore.Timestamp.fromMillis(endTime);
    const startTimestamp = admin.firestore.Timestamp.fromMillis(startTime);
    const today = moment().utc().subtract(1, 'day').format('DD-MM-YYYY');

    const snapshot = await firestore.collection('user').get();
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // const result = [];
    for (const user of users) {
      const { id, username, address } = user;
      console.log(`Extracting user ${id} - ${username}`);
      try {
        const txnSnapshot = await firestore
          .collection('transaction')
          .where('userId', '==', id)
          .where('seasonId', '==', seasonId)
          .where('status', '==', 'Success')
          .where('createdAt', '>=', startTimestamp)
          .where('createdAt', '<=', endTimestamp)
          .get();
        const numberOfTransactions = txnSnapshot.size;
        const todayTxns = txnSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        const buyGangsterTxns = todayTxns.filter((txn) => txn.type === 'buy-machine');
        const ethSpend = buyGangsterTxns.reduce((total, txn) => total + txn.value, 0);

        const claimTxns = todayTxns.filter((txn) => txn.type === 'claim-token');
        const todayClaimedToken = claimTxns.reduce((total, txn) => total + txn.value, 0);

        const bonusAmount = buyGangsterTxns.reduce((total, txn) => total + txn.bonusAmount, 0);
        const fiatGeneration = todayClaimedToken + bonusAmount;

        // result.push({
        //   startTime: new Date(startTime).toLocaleString(),
        //   endTime: new Date(endTime).toLocaleString(),
        //   userId: id,
        //   username,
        //   address,
        //   numberOfTransactions,
        //   ethSpend,
        //   fiatGeneration,
        // });

        const existedSnapshot = await firestore
          .collection('monitor')
          .where('seasonId', '==', seasonId)
          .where('userId', '==', id)
          .where('date', '==', today)
          .limit(1)
          .get();
        if (existedSnapshot.empty) {
          await firestore.collection('monitor').add({
            seasonId,
            date: today,
            userId: id,
            username,
            address,
            numberOfTransactions,
            ethSpend,
            fiatGeneration,
            startTime: startTimestamp,
            endTime: endTimestamp,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          await existedSnapshot.docs[0].ref.update({
            numberOfTransactions,
            ethSpend,
            fiatGeneration,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
        console.log(`Done extracting user ${id} - ${username}`);
      } catch (err) {
        console.log(`Error in extracting user ${id} - ${username}`, err);
        continue;
      }

      // fs.writeFileSync('./data.json', JSON.stringify(result), { encoding: 'utf-8' });
    }
  } catch (err) {
    console.error(err);
  }
};

export default extractUser;
