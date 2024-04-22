import { firestore } from '../configs/admin.config.js';
import { getActiveSeason } from '../utils/utils.js';

const main = async () => {
  const activeSeason = await getActiveSeason();
  await firestore
    .collection('season')
    .doc(activeSeason.id)
    .update({
      machine: {
        ...activeSeason.machine,
        basePrice: 3000,
        targetDailyPurchase: 3000,
        targetPrice: 3000,
      },
    });
};

main()
  .then(() => console.log('done!'))
  .catch(console.error);
