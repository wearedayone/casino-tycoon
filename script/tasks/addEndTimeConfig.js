import { firestore } from '../configs/admin.config.js';
import { getActiveSeasonId } from '../utils/utils.js';

const main = async () => {
  const activeSeasonId = await getActiveSeasonId();
  await firestore
    .collection('season')
    .doc(activeSeasonId)
    .update({
      endTimeConfig: {
        timeIncrementInSeconds: 60,
        timeDecrementInSeconds: 10,
      },
    });
};

main()
  .then(() => console.log('done!'))
  .catch(console.error);
