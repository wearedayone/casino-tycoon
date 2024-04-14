import { usePrivy } from '@privy-io/react-auth';
import { useState, useLayoutEffect, useMemo } from 'react';

import AuthRoutes from './AuthRoutes';
import MainRoutes from './MainRoutes';
import ValidationRoutes from './ValidationRoutes';
import Loading from '../components/Loading';
import useSystem from '../hooks/useSystem';
import useCheckCreateWallet from '../hooks/useCheckCreateWallet';
import useUserProfile from '../hooks/useUserProfile';
import useUserGamePlay from '../hooks/useUserGamePlay';
import useUserWallet from '../hooks/useUserWallet';
import useLastOnlineTime from '../hooks/useLastOnlineTime';
import useSystemStore from '../stores/system.store';
import useUserStore from '../stores/user.store';

const Navigations = () => {
  const { ready, authenticated, user } = usePrivy();
  const { userWallet } = useUserWallet();
  const [isInAuthFlow, setIsInAuthFlow] = useState(false);

  useSystem();
  useUserProfile(ready, user, userWallet);
  useCheckCreateWallet(userWallet);
  useUserGamePlay();
  useLastOnlineTime();

  const configs = useSystemStore((state) => state.configs);
  const profile = useUserStore((state) => state.profile);

  const isLoading = useMemo(
    () => !ready || !configs || configs?.disabledUrls?.includes(window.location.host),
    [ready, configs, window.location.host]
  );
  const isBlocked = configs?.disabledUrls?.includes(window.location.host);

  useLayoutEffect(() => {
    if (!isLoading) {
      // add delay when moving away from /login page => privy has time to hide login ui
      if (authenticated) setTimeout(() => setIsInAuthFlow(false), 200);
      else setIsInAuthFlow(true);
    }
  }, [isLoading, authenticated]);

  if (isLoading) return <Loading isBlocked={isBlocked} />;

  if (!authenticated || isInAuthFlow) return <AuthRoutes />;

  if (!profile) return <Loading />;

  if (profile && !profile.socials?.twitter?.verified) return <ValidationRoutes />;

  return <MainRoutes />;
};

export default Navigations;
