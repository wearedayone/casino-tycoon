import { usePrivy } from '@privy-io/react-auth';
import { useState, useLayoutEffect, useMemo } from 'react';

import AuthRoutes from './AuthRoutes';
import MainRoutes from './MainRoutes';
import Loading from '../components/Loading';
import useSystem from '../hooks/useSystem';
import useCheckCreateWallet from '../hooks/useCheckCreateWallet';
import useUserProfile from '../hooks/useUserProfile';
import useUserGamePlay from '../hooks/useUserGamePlay';
import useUserWallet from '../hooks/useUserWallet';
import useLastOnlineTime from '../hooks/useLastOnlineTime';
import useLastSpin from '../hooks/useLastSpin';
import useSystemStore from '../stores/system.store';

const Navigations = () => {
  const { ready, authenticated, user, logout } = usePrivy();
  const { userWallet } = useUserWallet();
  const [isInAuthFlow, setIsInAuthFlow] = useState(true);

  useSystem();
  useUserProfile(ready, user, userWallet);
  useCheckCreateWallet(userWallet);
  useUserGamePlay();
  useLastOnlineTime();
  useLastSpin();

  const configs = useSystemStore((state) => state.configs);

  const isLoading = useMemo(
    () => !ready || !configs || configs?.disabledUrls?.includes(window.location.host),
    [ready, configs, window.location.host]
  );
  const isBlocked = configs?.disabledUrls?.includes(window.location.host);

  useLayoutEffect(() => {
    if (!isLoading) {
      if (authenticated) setTimeout(() => setIsInAuthFlow(false), 200);
      else setIsInAuthFlow(true);
    }
  }, [isLoading, authenticated]);

  if (isLoading) return <Loading isBlocked={isBlocked} />;

  if (!authenticated || isInAuthFlow) return <AuthRoutes />;

  return <MainRoutes />;
};

export default Navigations;
