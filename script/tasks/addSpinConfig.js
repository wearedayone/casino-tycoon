import { firestore } from '../configs/admin.config.js';
import { getActiveSeasonId } from '../utils/utils.js';

const main = async () => {
  const activeSeasonId = await getActiveSeasonId();
  await firestore
    .collection('season')
    .doc(activeSeasonId)
    .update({
      spinConfig: {
        spinRewards: [
          {
            type: 'house',
            value: 1,
            order: 1,
            percentage: 0.2,
            iconImg: 'spin-reward-house-1',
            containerImg: 'spin-container-1',
          },
          {
            type: 'house',
            value: 2,
            order: 2,
            percentage: 0.08,
            iconImg: 'spin-reward-house-2',
            containerImg: 'spin-container-2',
          },
          {
            type: 'house',
            value: 3,
            order: 3,
            percentage: 0.04,
            iconImg: 'spin-reward-house-3',
            containerImg: 'spin-container-3',
          },
          {
            type: 'house',
            value: 5,
            order: 4,
            percentage: 0.009,
            iconImg: 'spin-reward-house-4',
            containerImg: 'spin-container-4',
          },
          {
            type: 'house',
            value: 20,
            order: 5,
            percentage: 0.001,
            iconImg: 'spin-reward-house-5',
            containerImg: 'spin-container-5',
          },
          {
            type: 'GANG',
            value: 100,
            order: 6,
            percentage: 0.05,
            iconImg: 'spin-reward-token-1',
            containerImg: 'spin-container-1',
          },
          {
            type: 'GANG',
            value: 300,
            order: 7,
            percentage: 0.13,
            iconImg: 'spin-reward-token-1',
            containerImg: 'spin-container-1',
          },
          {
            type: 'GANG',
            value: 400,
            order: 8,
            percentage: 0.28,
            iconImg: 'spin-reward-token-1',
            containerImg: 'spin-container-1',
          },
          {
            type: 'GANG',
            value: 500,
            order: 9,
            percentage: 0.1,
            iconImg: 'spin-reward-token-1',
            containerImg: 'spin-container-1',
          },
          {
            type: 'GANG',
            value: 800,
            order: 10,
            percentage: 0.07,
            iconImg: 'spin-reward-token-2',
            containerImg: 'spin-container-2',
          },
          {
            type: 'GANG',
            value: 1500,
            order: 11,
            percentage: 0.027,
            iconImg: 'spin-reward-token-3',
            containerImg: 'spin-container-3',
          },
          {
            type: 'GANG',
            value: 4500,
            order: 12,
            percentage: 0.009,
            iconImg: 'spin-reward-token-4',
            containerImg: 'spin-container-4',
          },
          {
            type: 'GANG',
            value: 10000,
            order: 13,
            percentage: 0.003,
            iconImg: 'spin-reward-token-5',
            containerImg: 'spin-container-4',
          },
          {
            type: 'GANG',
            value: 50000,
            order: 14,
            percentage: 0.001,
            iconImg: 'spin-reward-token-6',
            containerImg: 'spin-container-5',
          },
        ],
        spinIncrementStep: 1,
        maxSpin: 10,
      },
    });
};

main()
  .then(() => console.log('done!'))
  .catch(console.error);
