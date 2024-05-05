import { useState, useEffect } from 'react';
import axios from 'axios';

const useEthPrice = () => {
  const [ethPrice, setEthPrice] = useState(0);

  const getEthPrice = async () => {
    try {
      const res = await axios.get('https://api.coinbase.com/v2/exchange-rates?currency=ETH');
      const price = Number(res.data.data.rates.USD);
      setEthPrice(price);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getEthPrice();
  }, []);

  return { ethPrice };
};

export default useEthPrice;
