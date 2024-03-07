import { useEffect, useRef } from 'react';
import { useWallets, usePrivy } from '@privy-io/react-auth';
import * as Sentry from '@sentry/react';

import environments from '../utils/environments';

const { NETWORK_ID } = environments;

const useUserWallet = () => {
  const { ready: authReady, authenticated, createWallet } = usePrivy();
  const { ready: walletReady, wallets } = useWallets();
  const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');

  const switchChain = async () => {
    await embeddedWallet?.switchChain(Number(NETWORK_ID));
  };

  const timeout = useRef();
  useEffect(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }

    console.log({ authReady, authenticated, walletReady, wallets });
    const userEmbeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');

    if (authReady && authenticated && (!walletReady || !userEmbeddedWallet)) {
      if (!userEmbeddedWallet) {
        timeout.current = setTimeout(() => {
          createWallet()
            .then(() => console.log('New wallet created'))
            .catch((err) => {
              console.error(err);
              if (!err.message.includes('Only one Privy wallet per user is currently allowed')) {
                Sentry.captureException(err);
              }
            });
        }, 2000);
      }
    }
  }, [authReady, walletReady, authenticated]);

  useEffect(() => {
    if (embeddedWallet) {
      switchChain().catch((err) => {
        console.error(err);
        Sentry.captureException(err);
      });
    }
  }, [embeddedWallet]);

  return embeddedWallet;
};

export default useUserWallet;
