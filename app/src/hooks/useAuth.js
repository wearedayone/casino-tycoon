import { useState, useEffect } from 'react';

import useUserProfile from './useUserProfile';
import useUserGamePlay from './useUserGamePlay';
import useUserMachine from './useUserMachine';
import useUserWorker from './useUserWorker';
import useUserBuilding from './useUserBuilding';

const useAuth = () => {
  const [userId, setUserId] = useState(null);
  useUserProfile(userId);
  useUserGamePlay();
  useUserMachine();
  useUserWorker();
  useUserBuilding();

  // TODO: now use for testing, rm and use privy.io api later
  useEffect(() => {
    if (!window.setUserId && setUserId) {
      window.setUserId = setUserId;
    }
  }, [setUserId]);
};

export default useAuth;
