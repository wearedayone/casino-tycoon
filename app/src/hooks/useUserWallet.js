import { useEffect, useMemo, useState } from 'react';
import { useWallets, usePrivy } from '@privy-io/react-auth';
import * as Sentry from '@sentry/react';

import environments from '../utils/environments';

const { NETWORK_ID } = environments;

const useUserWallet = () => {
  const [walletProvider, setWalletProvider] = useState(null);
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const userWallet = useMemo(
    () => user?.wallet && wallets.find((wallet) => wallet.address.toLowerCase() === user.wallet.address.toLowerCase()),
    [user?.wallet, wallets]
  );
  const embeddedWallet = useMemo(() => wallets.find((wallet) => wallet.walletClientType === 'privy'), [wallets]);

  const switchChain = async () => {
    try {
      userWallet.chainId !== NETWORK_ID && (await userWallet.switchChain(Number(NETWORK_ID)));
    } catch (err) {
      if (err.message.includes(`Request of type 'wallet_switchEthereumChain' already pending`)) return;
      throw err;
    }
  };

  useEffect(() => {
    if (userWallet) {
      switchChain().catch((err) => {
        console.error(err);
        Sentry.captureException(err);
      });
    }
  }, [userWallet]);

  const getProvider = async () => {
    if (walletProvider) return walletProvider;

    const provider =
      userWallet.walletClientType === 'privy'
        ? (await userWallet.getEthereumProvider()).provider
        : await userWallet.getEthersProvider();

    setWalletProvider(provider);

    return provider;
  };

  return { embeddedWallet, userWallet, getProvider };
};

export default useUserWallet;
