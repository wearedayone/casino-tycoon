import { firestore } from '../configs/admin.config.js';
import { getActiveSeason } from '../utils/utils.js';

const main = async () => {
  const { id, building } = await getActiveSeason();

  await firestore
    .collection('season')
    .doc(id)
    .update({
      building: {
        ...building,
        initMachineCapacity: 20,
        machineCapacityIncrementPerLevel: 20,
      },
    });

  const gamePlay = await firestore.collection('gamePlay').where('seasonId', '==', id).get();
  const promises = gamePlay.docs.map((doc) => doc.ref.update({ building: { level: 0, machineCapacity: 20 } }));
  await Promise.all(promises);
};

main()
  .then(() => console.log('done!'))
  .catch(console.error);
