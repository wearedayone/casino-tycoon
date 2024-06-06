import axios from 'axios';

import { firestore } from '../configs/admin.config.js';

const getEthPrice = async () => {
  try {
    const res = await axios.get('https://api.coinbase.com/v2/exchange-rates?currency=ETH');
    await firestore.collection('system').doc('market').update({ ethPriceInUsd: res.data.data.rates.USD });
  } catch (err) {
    console.error(err);
  }
};

// getEthPrice();

export default getEthPrice;
