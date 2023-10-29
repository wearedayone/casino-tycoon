// import { firestore } from '../configs/admin.config.js';
// import environments from '../utils/environments.js';
import tokenListener, { queryEvent } from './tokenListener.js';
// const { NETWORK_ID } = environments;

const setupEventListener = async () => {
  tokenListener();
};

export const processPastEvent = async () => {
  // const doc = await firestore.collection('web3Listener').doc(NETWORK_ID).get();
  // const { lastBlock } = doc.data();
  // await queryEvent(lastBlock);
};

export default setupEventListener;
