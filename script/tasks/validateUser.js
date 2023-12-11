import { getActiveSeason, getActiveSeasonId } from '../utils/utils.js';
import { firestore } from '../configs/admin.config.js';
import alchemy from '../configs/alchemy.config.js';
import moment from 'moment';

const main = async ({ userId }) => {
  try {
    const activeSeasonId = await getActiveSeasonId();
    console.log('Start validation');
    const userSnapshot = await firestore.collection('user').doc(userId).get();
    if (userSnapshot.exists) {
      const userId = userSnapshot.id;
      const gamePlaySnapshot = await firestore
        .collection('gamePlay')
        .where('seasonId', '==', activeSeasonId)
        .where('userId', '==', userId)
        .limit(1)
        .get();
      if (gamePlaySnapshot.empty) {
        console.log(`User have no gameplay ${userId}`);
        return;
      }
      const { numberOfBuildings, numberOfWorkers, numberOfMachines } = gamePlaySnapshot.docs[0].data();
      let calNumberOfBuildings = 0;
      let calNumberOfWorkers = 0;
      let calNumberOfMachines = 0;

      const transactionSnapshot = await firestore
        .collection('transaction')
        .where('userId', '==', userId)
        .where('seasonId', '==', activeSeasonId)
        .where('status', '==', 'Success')
        .orderBy('createdAt', 'asc')
        .get();
      if (transactionSnapshot.empty) {
        return;
      }
      for (const transaction of transactionSnapshot.docs) {
        const { type, amount, machinesDeadCount, workersDeadCount, createdAt, txnHash } = transaction.data();
        const createdAtDate = new Date(createdAt.seconds * 1000);
        if (type == 'buy-machine' || type == 'buy-worker' || type == 'buy-building') {
          // if (moment(createdAtDate) > moment(Date.now()).subtract(60 * 60 * 24))
          console.log(
            `${moment(createdAtDate).utc().format('MM/DD HH:mm:ss')}: ${
              type == 'buy-worker' ? 'buy-goon' : type == 'buy-machine' ? 'buy-gangster' : 'buy-safehouse'
            } - ${amount} - ${txnHash}`
          );
        }
        switch (type) {
          case 'buy-worker':
            calNumberOfWorkers += amount;
            break;
          case 'buy-machine':
            calNumberOfMachines += amount;
            break;
          case 'buy-building':
            calNumberOfBuildings += amount;
            break;
          case 'war-penalty':
            calNumberOfWorkers -= workersDeadCount;
            calNumberOfMachines -= machinesDeadCount;
            break;
          case 'withdraw-machine':
            calNumberOfMachines -= amount;
            break;
          case 'deposit-machine':
            calNumberOfMachines += amount;
            break;
        }
      }
      if (
        calNumberOfBuildings != numberOfBuildings ||
        calNumberOfMachines != numberOfMachines ||
        calNumberOfWorkers != numberOfWorkers
      ) {
        console.log({
          userId,
          calNumberOfBuildings,
          calNumberOfMachines,
          calNumberOfWorkers,
          numberOfBuildings,
          numberOfMachines,
          numberOfWorkers,
        });
      }
    }

    console.log(`Query pending transaction`);
    const snapshotTxn = await firestore.collection('transaction').where('status', '==', 'Pending').get();
    if (!snapshotTxn.empty) {
      console.log(snapshotTxn.docs.length);
    }
  } catch (err) {
    console.log({ err });
  }
};

main({ userId: 'did:privy:clpuuqaud00djl90fv28r5aeb' });
