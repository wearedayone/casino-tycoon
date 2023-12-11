import { getActiveSeason, getActiveSeasonId } from '../utils/utils.js';
import { firestore } from '../configs/admin.config.js';
import alchemy from '../configs/alchemy.config.js';

const main = async () => {
  try {
    const activeSeasonId = await getActiveSeasonId();
    console.log('Start validation');
    const userSnapshot = await firestore.collection('user').get();
    if (!userSnapshot.empty) {
      for (const user of userSnapshot.docs) {
        const userId = user.id;
        const gamePlaySnapshot = await firestore
          .collection('gamePlay')
          .where('seasonId', '==', activeSeasonId)
          .where('userId', '==', userId)
          .limit(1)
          .get();
        if (gamePlaySnapshot.empty) {
          console.log(`User have no gameplay ${userId}`);
          continue;
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
          .get();
        if (transactionSnapshot.empty) {
          continue;
        }
        for (const transaction of transactionSnapshot.docs) {
          const { type, amount, machinesDeadCount, workersDeadCount } = transaction.data();
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

main();
