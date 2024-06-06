const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.onGamePlayUpdate = functions.firestore
  .document('gamePlay/{gamePlayId}')
  .onUpdate(async ({ before, after }, context) => {
    functions.logger.info('gamePlay update');
    const { gamePlayId } = context.params;
    const beforeData = before.data();
    const afterData = after.data();
    if (
      beforeData.numberOfBuildings !== afterData.numberOfBuildings ||
      beforeData.numberOfMachines !== afterData.numberOfMachines ||
      beforeData.numberOfWorkers !== afterData.numberOfWorkers
    ) {
      const { seasonId } = afterData;
      const season = await admin.firestore().collection('season').doc(seasonId).get();
      if (season.exists) {
        const { building, machine, worker } = season.data();
        const newNetworth =
          building.networth * afterData.numberOfBuildings +
          machine.networth * afterData.numberOfMachines +
          worker.networth * afterData.numberOfWorkers;
        if (newNetworth !== afterData.networth)
          await admin.firestore().collection('gamePlay').doc(gamePlayId).update({
            networth: newNetworth,
          });
      }
    }
  });
