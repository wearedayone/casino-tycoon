import * as ethers from 'ethers';
import { firestore } from '../configs/admin.config.js';
import alchemy from '../configs/alchemy.config.js';
import privy from '../configs/privy.config.js';
import environments from '../utils/environments.js';
const { WALLET_PRIVATE_KEY: privateKey } = environments;

const main = async () => {
  const userSnapshot = await firestore.collection('user').get();
  console.log(`update wallet`);
  const users = userSnapshot.docs.map((item) => ({
    userId: item.id,
    username: item.data().username,
    address: item.data().address,
  }));

  for (const user of users) {
    console.log(`update wallet ${user.username}`);
    try {
      if (!user.address) {
        console.log(`update wallet ${user.username}`);
        const userPrivy = await privy.getUser(user.userId);
        if (userPrivy?.wallet?.address) {
          console.log(`update wallet ${user.username}: ${userPrivy?.wallet?.address}`);
          await firestore
            .collection('user')
            .doc(user.userId)
            .update({ address: userPrivy?.wallet?.address.toLowerCase() });
        }
      }
    } catch (err) {
      console.error(`Error while update for ${user.username}`, err.message);
      continue;
    }
  }
};

main()
  .then(() => console.log('done!'))
  .then(process.exit)
  .catch(process.exit);
