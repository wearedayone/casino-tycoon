import { useEffect, useMemo, useRef, useState } from 'react';
import { useWallets, usePrivy } from '@privy-io/react-auth';
import * as Sentry from '@sentry/react';

import environments from '../utils/environments';

const { NETWORK_ID } = environments;

const useUserWallet = () => {
  const [walletProvider, setWalletProvider] = useState(null);
  const { ready: authReady, authenticated, user, createWallet } = usePrivy();
  const { ready: walletReady, wallets } = useWallets();
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

  const timeout = useRef();
  useEffect(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }
    console.log({ walletReady, embeddedWallet, user, userWallet: userWallet });
    if (authReady && authenticated && (!walletReady || !userWallet)) {
      if (!userWallet) {
        timeout.current = setTimeout(() => {
          // createWallet()
          //   .then(() => console.log('New wallet created'))
          //   .catch((err) => {
          //     console.error(err);
          //     if (!err.message.includes('Only one Privy wallet per user is currently allowed')) {
          //       Sentry.captureException(err);
          //     }
          //   });
        }, 2000);
      }
    }
  }, [authReady, walletReady, authenticated]);

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
        : (await userWallet.getEthersProvider());

    setWalletProvider(provider);

    return provider;
  };

  return { embeddedWallet, userWallet, getProvider };
};

export default useUserWallet;
