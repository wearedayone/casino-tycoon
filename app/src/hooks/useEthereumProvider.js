import { useState, useEffect } from 'react';
import detectEthereumProvider from '@metamask/detect-provider';

const useEthereumProvider = () => {
  const [provider, setProvider] = useState();

  useEffect(() => {
    checkProvider();
  }, []);

  const checkProvider = async () => {
    const provider1 = await detectEthereumProvider();
    console.log({ name: 'useProvider', ...provider1 });
    setProvider(provider1);
  };
  return { browserProvider: provider };
};

export default useEthereumProvider;
