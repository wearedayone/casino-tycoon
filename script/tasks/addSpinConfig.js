import { firestore } from '../configs/admin.config.js';
import { getActiveSeasonId } from '../utils/utils.js';

const main = async () => {
  const activeSeasonId = await getActiveSeasonId();
  await firestore
    .collection('season')
    .doc(activeSeasonId)
    .update({
      spinRewards: [
        { type: 'house', value: 1, order: 1, percentage: 0.26 },
        { type: 'house', value: 2, order: 2, percentage: 0.13 },
        { type: 'house', value: 3, order: 3, percentage: 0.07 },
        { type: 'house', value: 5, order: 4, percentage: 0.03 },
        { type: 'house', value: 10, order: 5, percentage: 0.009 },
        { type: 'house', value: 50, order: 6, percentage: 0.001 },
        { type: 'point', value: 10, order: 7, percentage: 0.01 },
        { type: 'point', value: 50, order: 8, percentage: 0.03 },
        { type: 'point', value: 100, order: 9, percentage: 0.07 },
        { type: 'point', value: 250, order: 10, percentage: 0.15 },
        { type: 'point', value: 500, order: 11, percentage: 0.13 },
        { type: 'point', value: 1000, order: 12, percentage: 0.07 },
        { type: 'point', value: 2500, order: 13, percentage: 0.03 },
        { type: 'point', value: 10000, order: 14, percentage: 0.009 },
        { type: 'point', value: 50000, order: 15, percentage: 0.001 },
      ],
    });
};

main()
  .then(() => console.log('done!'))
  .catch(console.error);
