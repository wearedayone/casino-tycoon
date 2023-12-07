import { useEffect } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';

import { firestore } from '../configs/firebase.config';
import useUserStore from '../stores/user.store';
import useModalStore from '../stores/modal.store';
import useUserWallet from './useUserWallet';
import { getMe } from '../services/user.service';
import useSmartContract from './useSmartContract';

const useUserProfile = (ready, user) => {
  const embeddedWallet = useUserWallet();
  const setInitialized = useUserStore((state) => state.setInitialized);
  const setProfile = useUserStore((state) => state.setProfile);
  const profile = useUserStore((state) => state.profile);
  const setClaimable = useUserStore((state) => state.setClaimable);
  const setOpenSetWalletPassword = useModalStore((state) => state.setOpenSetWalletPassword);
  const { isMinted } = useSmartContract();

  useEffect(() => {
    let unsubscribe;
    if (ready) {
      if (user && !!embeddedWallet) {
        getMe()
          .then(() => {
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
          })
          .catch((err) => console.error(err));
      } else {
        setProfile(null);
        setInitialized(true);
      }
    }

    return () => unsubscribe?.();
  }, [ready, user, embeddedWallet]);

  useEffect(() => {
    if (embeddedWallet && profile) {
      isMinted(profile.address).then((minted) => setClaimable(minted));

      if (!profile.walletPasswordAsked) {
        setOpenSetWalletPassword(true);
      }
    }
  }, [embeddedWallet, profile]);
};

export default useUserProfile;
