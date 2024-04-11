import { useEffect, useRef } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import * as Sentry from '@sentry/react';

export default function useCheckCreateWallet(userWallet) {
  const { ready: authReady, authenticated, createWallet } = usePrivy();
  const { ready: walletReady } = useWallets();

  const timeout = useRef();
  useEffect(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }
    if (authReady && authenticated && walletReady && !userWallet) {
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
  }, [authReady, walletReady, authenticated]);
}
