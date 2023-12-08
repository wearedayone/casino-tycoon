import * as ethers from 'ethers';
import { firestore } from '../configs/admin.config.js';
import alchemy from '../configs/alchemy.config.js';
import environments from '../utils/environments.js';
import privy from '../configs/privy.config.js';

const { WALLET_PRIVATE_KEY: privateKey } = environments;

const amountInEther = '0.0109';

const sendEther = async () => {
  console.log(`Sending ETH `);
  const provider = await alchemy.config.getProvider();
  const wallet = new ethers.Wallet(privateKey, provider);
  const userSnapshot = await firestore.collection('user').get();

  const users = userSnapshot.docs.filter((item) => !item.data().dropETH);
  const receivers = users.map((item) => ({
    userId: item.id,
    username: item.data().username,
    address: item.data().address,
  }));

  for (const receiver of receivers) {
    try {
      const balance = await provider.getBalance(receiver.address);
      // console.log({ username, address, balance });
      const lowestETH = ethers.utils.parseEther('0.001');
      if (balance.gt(lowestETH)) continue;
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
  const givetxnfee = false;
  if (givetxnfee) {
    const allUsers = userSnapshot.docs.map((item) => ({
      userId: item.id,
      username: item.data().username,
      address: item.data().address,
    }));
    // console.log(receivers);
    for (const receiver of allUsers) {
      const { username, address } = receiver;
      const balance = await provider.getBalance(address);
      // console.log({ username, address, balance });
      const lowestETH = ethers.utils.parseEther('0.00099');
      if (balance.lt(lowestETH)) {
        try {
          console.log(
            `Sending fee ETH for address ${receiver.username} - ${receiver.address} - ${ethers.utils.formatEther(
              lowestETH.sub(balance)
            )}`
          );
          const tx = {
            to: receiver.address,
            value: lowestETH.sub(balance),
          };
          // Send a transaction
          const receipt = await wallet.sendTransaction(tx);
          const txn = await receipt.wait();
          if (txn.status === 1) {
            console.log(
              `Sent ${ethers.utils.formatEther(lowestETH.sub(balance))} ETH for address ${
                receiver.username
              }.\nTxn hash: ${txn.transactionHash}`
            );
            await firestore.collection('user').doc(receiver.userId).update({ dropETH: true });
          } else {
            throw new Error(`Something wrong ${JSON.stringify(receipt)}`);
          }
        } catch (err) {
          console.error(`Error while sending ETH for ${receiver.username}`, err.message);
          continue;
        }
      }
    }
  }
  console.log(`Finish send ETH `);
};

const patchWallet = async () => {
  console.log(`update wallet`);
  const userSnapshot = await firestore.collection('user').get();
  const users = userSnapshot.docs.map((item) => ({
    userId: item.id,
    username: item.data().username,
    address: item.data().address,
  }));

  for (const user of users) {
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

const autoRun = async () => {
  await patchWallet();
  await sendEther();
  setTimeout(autoRun, 60000);
};

autoRun();
