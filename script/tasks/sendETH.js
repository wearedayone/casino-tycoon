import * as ethers from 'ethers';
import { firestore } from '../configs/admin.config.js';
import alchemy from '../configs/alchemy.config.js';
import environments from '../utils/environments.js';
const { WALLET_PRIVATE_KEY: privateKey } = environments;

const amountInEther = '0.0109';

const main = async () => {
  const provider = await alchemy.config.getProvider();
  const wallet = new ethers.Wallet(privateKey, provider);
  const balance = await provider.getBalance(wallet.address);
  console.log(balance.toString());
  const userSnapshot = await firestore.collection('user').get();
  const users = userSnapshot.docs.filter((item) => !item.data().dropETH);
  const receivers = users.map((item) => ({
    userId: item.id,
    username: item.data().username,
    address: item.data().address,
  }));

  for (const receiver of receivers) {
    try {
      console.log(`Sending ETH for address ${receiver.username} - ${receiver.address}`);
      const tx = {
        to: receiver.address,
        value: ethers.utils.parseEther(amountInEther),
      };
      // Send a transaction
      const receipt = await wallet.sendTransaction(tx);
      const txn = await receipt.wait();
      if (txn.status === 1) {
        console.log(`Sent ${amountInEther} ETH for address ${receiver.username}.\nTxn hash: ${txn.transactionHash}`);
        await firestore.collection('user').doc(receiver.userId).update({ dropETH: true });
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
