import { firestore } from '../configs/admin.config.js';

const getActiveSeasonId = async () => {
  const snapshot = await firestore.collection('system').doc('default').get();
  const configs = snapshot.data();

  return configs.activeSeasonId;
};

const getActiveSeason = async () => {
  const activeSeasonId = await getActiveSeasonId();
  const snapshot = await firestore.collection('season').doc(activeSeasonId).get();

  return { id: snapshot.id, ...snapshot.data() };
};

const updateWarConfig = async () => {
  const activeSeason = await getActiveSeason();
  const { id: activeSeasonId, warConfig } = activeSeason;

  if (!warConfig.buildingBonusMultiple) {
    await firestore
      .collection('season')
      .doc(activeSeasonId)
      .update({
        warConfig: {
          ...warConfig, // keep the old config to avoid breaking down everything
          buildingBonusMultiple: 1,
          workerBonusMultiple: 1,
          earningStealPercent: 0.5,
          tokenRewardPerEarner: 500,
          machinePercentLost: 0.1,
        },
      });
  }
};

const updateUserWarDeployment = async () => {
  const activeSeason = await getActiveSeason();
  const { id: activeSeasonId, warConfig } = activeSeason;

  const gamePlaySnapshot = await firestore.collection('gamePlay').where('seasonId', '==', activeSeasonId).get();
  const promises = [];
  for (const gamePlay of gamePlaySnapshot.docs) {
    const { warDeployment, numberOfMachines } = gamePlay.data();
    if (!warDeployment) {
      promises.push(
        gamePlay.ref.update({
          warDeployment: {
            numberOfMachinesToEarn: numberOfMachines,
            numberOfMachinesToAttack: 0,
            numberOfMachinesToDefend: 0,
            attackUserId: null,
          },
        })
      );
    }
  }
  await Promise.all(promises);
};

const main = async () => {
  await updateWarConfig();
  await updateUserWarDeployment();
};

main()
  .then(() => console.log('done'))
  .then(process.exit)
  .catch((err) => console.error(err));
