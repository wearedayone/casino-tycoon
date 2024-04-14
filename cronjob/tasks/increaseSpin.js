import { firestore } from '../configs/admin.config.js';
import { getActiveSeason } from '../utils/utils.js';

const increaseSpin = async () => {
  try {
    console.log('Increase spin for users');
    const activeSeason = await getActiveSeason();

    const { spinIncrementStep, maxSpin } = activeSeason.spinConfig;

    const gamePlays = await firestore
      .collection('gamePlay')
      .where('seasonId', '==', activeSeason.id)
      .where('active', '==', true)
      .get();
    const promises = [];
    for (const gamePlay of gamePlays.docs) {
      const { numberOfSpins } = gamePlay.data();
      let newNumberOfSpins = numberOfSpins ? Math.min(numberOfSpins + spinIncrementStep, maxSpin) : spinIncrementStep;

      if (newNumberOfSpins !== numberOfSpins) {
        promises.push(gamePlay.ref.update({ numberOfSpins: newNumberOfSpins }));
      }
    }
    await Promise.all(promises);
    console.log('done');
  } catch (err) {
    console.log(`Error in increasing spin: `, err);
  }
};

export default increaseSpin;
