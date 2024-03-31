import admin, { firestore } from '../configs/admin.config.js';
import moment from 'moment';
import fs from 'fs';

const updateUserClaimTime = async () => {
  const gamePlaySnapshot = await firestore.collection('gamePlay').where('active', '==', true).get();
  let user = [];
  for (const gamePlay of gamePlaySnapshot.docs) {
    const { username, pendingReward, startRewardCountingTime, numberOfMachines, numberOfWorkers } = gamePlay.data();
    const isPatched = gamePlay.data()?.isPatched;
    if (isPatched) continue;
    const time = moment.unix(startRewardCountingTime.toMillis() / 1000);
    const dailyReward = numberOfMachines * 1000 + numberOfWorkers * 800;
    let newPendingReward = pendingReward;
    let newStartRewardCountingTime = startRewardCountingTime.toMillis();
    if (pendingReward > dailyReward) {
      console.log('change pendingReward');
      newPendingReward = pendingReward - dailyReward;
      // update pendingReward
      // await firestore.collection('gamePlay').doc(gamePlay.id).update({
      //   pendingReward: newPendingReward,
      //   isPatched: true,
      // });
    } else if (newStartRewardCountingTime + 24 * 60 * 60 * 1000 < 1711848600000) {
      console.log('change StartRewardCountingTime');
      newStartRewardCountingTime = newStartRewardCountingTime + 24 * 60 * 60 * 1000;
      // update newStartRewardCountingTime
      // await firestore
      //   .collection('gamePlay')
      //   .doc(gamePlay.id)
      //   .update({
      //     startRewardCountingTime: admin.firestore.Timestamp.fromMillis(newStartRewardCountingTime),
      //     isPatched: true,
      //   });
    } else {
      newPendingReward = 0;
      const negativeValue = dailyReward - pendingReward;
      const subMilliSecond = (negativeValue * 24 * 60 * 60 * 1000) / dailyReward;
      if (newStartRewardCountingTime + subMilliSecond < 1711848600000) {
        newStartRewardCountingTime = newStartRewardCountingTime + subMilliSecond;
        console.log('change both');
        // await firestore
        //   .collection('gamePlay')
        //   .doc(gamePlay.id)
        //   .update({
        //     pendingReward: 0,
        //     startRewardCountingTime: admin.firestore.Timestamp.fromMillis(newStartRewardCountingTime),
        //     isPatched: true,
        //   });
      } else {
        // await firestore
        //   .collection('gamePlay')
        //   .doc(gamePlay.id)
        //   .update({
        //     pendingReward: 0,
        //     startRewardCountingTime: admin.firestore.Timestamp.fromMillis(1711848600000),
        //     isPatched: true,
        //   });
        const nav =
          ((1711848600000 - newStartRewardCountingTime - subMilliSecond) * dailyReward) / (24 * 60 * 60 * 1000);
        console.log('----------------------cannot', username);
        console.log({
          id: gamePlay.id,
          username,
          startRewardCountingTime: moment.unix(startRewardCountingTime.toMillis() / 1000),
          dailyReward,
          pendingReward,
          numberOfMachines,
          numberOfWorkers,
          nav,
        });
      }
    }

    console.log({
      id: gamePlay.id,
      username,
      startRewardCountingTime: moment.unix(startRewardCountingTime.toMillis() / 1000),
      dailyReward,
      pendingReward,
      numberOfMachines,
      numberOfWorkers,
    });
    // user.push({
    //   id: gamePlay.id,
    //   username,
    //   startRewardCountingTime: moment.unix(startRewardCountingTime.toMillis() / 1000),
    //   dailyReward,
    //   pendingReward,
    //   numberOfMachines,
    //   numberOfWorkers,
    // });
  }
  // fs.writeFileSync('user.json', JSON.stringify(user));
};

const main = async () => {
  await updateUserClaimTime();
};

main()
  .then(() => console.log('done'))
  .catch((err) => console.error(err));
