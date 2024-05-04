import { Contract } from '@ethersproject/contracts';

import minter from '../assets/abis/Minter.json' assert { type: 'json' };
import { firestore } from '../configs/firebase.config.js';
import provider from '../configs/provider.config.js';
import environments from '../utils/environments.js';
import logger from '../utils/logger.js';

const { NETWORK_ID, MINTER_ADDRESS } = environments;
// console.log(environments);

const minterListener = async () => {
  logger.info(`Start listen contract ${MINTER_ADDRESS} on Network ${NETWORK_ID}`);
  const contract = new Contract(MINTER_ADDRESS, minter.abi, provider);

  contract.on('Mint', async (address, amount, phaseId, event) => {
    await firestore.collection('web3Listener').doc(NETWORK_ID).set({ lastBlock: event.blockNumber });
    await processMintEvent({ address, amount, phaseId, event, contract });
  });

  // processMintEvent({
  //   address: '0x81a05b26cbfaec5e786736c451535e18a717bbb9',
  //   amount: 1,
  //   phaseId: 1,
  //   event: '',
  //   contract,
  // });
};

// export const queryEvent = async (fromBlock) => {
//   const contract = new Contract(TOKEN_ADDRESS, tokenABI.abi, provider);
//   const depositEvents = await contract.queryFilter('Transfer', fromBlock);
//   for (const event of depositEvents) {
//     const [from, to, value] = event.args;
//     // console.log({ wallet, amount });
//     await processTransferEvent({ from, to, value, event, contract });
//   }
// };

const processMintEvent = async ({ address, amount, phaseId, event, contract }) => {
  try {
    logger.info('NFT minted');
    logger.info({ address, amount, phaseId });

    const phase = await firestore
      .collection('phase')
      .doc(`${Number(phaseId.toString())}`)
      .get();
    if (phase.exists) {
      // update phase data
      const phaseData = await contract.mintPhase(`${Number(phaseId.toString())}`);
      await phase.ref.update({ sold: Number(phaseData.currentSupply.toString()) });
    }

    const user = await firestore.collection('user').doc(address.toLowerCase()).get();
    if (user.exists) {
      // update user data
      const userData = await contract.mintedAddr(`${Number(phaseId.toString())}`, address.toLowerCase());
      await user.ref.update({
        mintedPhases: { ...user.data().mintedPhases, [phaseId.toString()]: Number(userData.toString()) },
      });
    }
  } catch (err) {
    logger.error(err);
  }
};

export default minterListener;
