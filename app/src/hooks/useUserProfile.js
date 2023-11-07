import { useEffect } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';

import { firestore } from '../configs/firebase.config';
import useUserStore from '../stores/user.store';
import useModalStore from '../stores/modal.store';
import useUserWallet from './useUserWallet';
import { getMe } from '../services/user.service';

const useUserProfile = (ready, user) => {
  const embeddedWallet = useUserWallet();
  const setInitialized = useUserStore((state) => state.setInitialized);
  const setProfile = useUserStore((state) => state.setProfile);
  const profile = useUserStore((state) => state.profile);
  const setOpenSetWalletPassword = useModalStore((state) => state.setOpenSetWalletPassword);

  useEffect(() => {
    let unsubscribe;
    if (ready) {
      if (user) {
        getMe()
          .then(() => {
            unsubscribe = onSnapshot(doc(firestore, 'user', user.id), (snapshot) => {
              if (snapshot.exists()) {
                setProfile({ id: snapshot.id, ...snapshot.data() });
                setInitialized(true);
              } else {
                setProfile(null);
                setInitialized(true);
              }
            });
          })
          .catch((err) => console.error(err));
      } else {
        setProfile(null);
        setInitialized(true);
      }
    }

    return () => unsubscribe?.();
  }, [ready, user]);

  useEffect(() => {
    if (embeddedWallet && profile) {
      if (!profile.walletPasswordAsked) {
        setOpenSetWalletPassword(true);
      }
    }
  }, [embeddedWallet, profile]);
};

export default useUserProfile;
