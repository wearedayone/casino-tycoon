import { useState, useEffect } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import * as Sentry from '@sentry/react';
import { useQuery } from '@tanstack/react-query';

import { firestore } from '../configs/firebase.config';
import useUserStore from '../stores/user.store';
import useModalStore from '../stores/modal.store';
import useUserWallet from './useUserWallet';
import { getMe } from '../services/user.service';
import useSmartContract from './useSmartContract';
import QueryKeys from '../utils/queryKeys';

const useUserProfile = (ready, user) => {
  const embeddedWallet = useUserWallet();
  const setInitialized = useUserStore((state) => state.setInitialized);
  const setProfile = useUserStore((state) => state.setProfile);
  const profile = useUserStore((state) => state.profile);
  const setClaimable = useUserStore((state) => state.setClaimable);
  const setOpenSetWalletPassword = useModalStore((state) => state.setOpenSetWalletPassword);
  const { isMinted } = useSmartContract();
  const [loaded, setLoaded] = useState(false);
  const { status, data } = useQuery({
    queryFn: getMe,
    queryKey: [QueryKeys.Me],
    enabled: ready && !!user && !!embeddedWallet,
    retry: 3,
    onError: (err) => {
      console.error(err);
      Sentry.captureException(err);
    },
    onSuccess: () => setLoaded(true),
  });

  useEffect(() => {
    let unsubscribe;
    if (ready) {
      if (user && !!embeddedWallet) {
        if (loaded) {
          unsubscribe = onSnapshot(doc(firestore, 'user', user.id), (snapshot) => {
            if (snapshot.exists()) {
              setProfile({ id: snapshot.id, ...snapshot.data() });
              setInitialized(true);
            } else {
              setProfile(null);
              setInitialized(true);
              setClaimable(false);
            }
          });
        }
      } else {
        setProfile(null);
        setInitialized(true);
      }
    }

    return () => unsubscribe?.();
  }, [ready, user, embeddedWallet, loaded]);

  useEffect(() => {
    if (embeddedWallet && profile) {
      isMinted(profile.address)
        .then((minted) => setClaimable(minted))
        .catch((err) => {
          console.error(err);
          Sentry.captureException(err);
        });

      if (!profile.walletPasswordAsked) {
        setOpenSetWalletPassword(true);
      }
    }
  }, [embeddedWallet, profile]);
};

export default useUserProfile;
