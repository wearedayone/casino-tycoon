import axios from 'axios';

import { firestore } from '../configs/admin.config.js';
import environments from '../utils/environments.js';

const { OPENSEA_API_KEY } = environments;

const updateNFTPrice = async () => {
  try {
    const configs = await firestore.collection('system').doc('default').get();
    const { activeSeasonId } = configs.data();
    const snapshot = await firestore.collection('season').doc(activeSeasonId).get();
    const { openseaNftCollection = 'gangster-arena' } = snapshot.data();
    const res = await axios.get(`https://api.opensea.io/api/v2/collections/${openseaNftCollection}/stats`, {
      headers: { Accept: 'application/json', 'x-api-key': OPENSEA_API_KEY },
    });

    const currentPrice = res.data.total.average_price.toString();

    const market = await firestore.collection('system').doc('market').get();
    if (market.exists) {
      const { nftPrice } = market.data();
      console.log({ currentPrice, nftPrice });
      if (nftPrice !== currentPrice) {
        await firestore.collection('system').doc('market').update({
          nftPrice: currentPrice,
        });
      }
    } else {
      await firestore.collection('system').doc('market').set({
        nftPrice: currentPrice,
      });
    }
  } catch (err) {
    console.error(err);
  }
};

export default updateNFTPrice;
