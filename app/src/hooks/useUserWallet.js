import { useEffect } from 'react';
import { useWallets } from '@privy-io/react-auth';

import environments from '../utils/environments';

const { NETWORK_ID } = environments;

const useUserWallet = () => {
  const { wallets } = useWallets();
  const embeddedWallet = wallets.find(
    (wallet) => wallet.walletClientType === 'privy'
  );

  const switchChain = async () => {
    await embeddedWallet?.switchChain(Number(NETWORK_ID));
  };

  useEffect(() => {
    if (embeddedWallet) {
      switchChain().catch((err) => console.error(err));
    }
  }, [embeddedWallet]);

  return embeddedWallet;
};

export default useUserWallet;
