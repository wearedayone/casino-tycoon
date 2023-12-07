import * as ethers from 'ethers';
import { firestore } from '../configs/admin.config.js';
import alchemy from '../configs/alchemy.config.js';
import environments from '../utils/environments.js';
const { WALLET_PRIVATE_KEY: privateKey } = environments;

const amountInEther = '0.0109';

const main = async () => {
  const provider = await alchemy.config.getProvider();
  const wallet = new ethers.Wallet(privateKey, provider);

  const userSnapshot = await firestore.collection('user').get();
  const users = userSnapshot.docs.filter((item) => !item.data().dropETH);
  const receivers = users.map((item) => ({ username: item.data().username, address: item.data().address }));

  // const receivers = [
  //   {
  //     username: 'jack.dayone',
  //     address: '0x65355C36a566bDD9912118F35dE2C94cEf2dBCf4',
  //   },
  // ];

  console.log(`Start to send ETH to users: \n${receivers.map((item) => item.username).join('\n')}`);

  for (const receiver of receivers) {
    try {
      console.log(`Sending ETH for address ${receiver.username}`);
      const tx = {
        to: receiver.address,
        value: ethers.utils.parseEther(amountInEther),
      };
      // Send a transaction
      const receipt = await wallet.sendTransaction(tx);
      const txn = await receipt.wait();
      if (txn.status === 1) {
        console.log(`Sent ${amountInEther} ETH for address ${receiver.username}.\nTxn hash: ${txn.transactionHash}`);
      } else {
        throw new Error(`Something wrong ${JSON.stringify(receipt)}`);
      }
    } catch (err) {
      console.error(`Error while sending ETH for ${receiver.username}`, err.message);
      continue;
    }
  }
};

main()
  .then(() => console.log('done!'))
  .then(process.exit)
  .catch(process.exit);
