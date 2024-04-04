import { usePrivy } from '@privy-io/react-auth';

import AuthRoutes from './AuthRoutes';
import MainRoutes from './MainRoutes';
import Loading from '../components/Loading';
import useSystem from '../hooks/useSystem';
import useUserProfile from '../hooks/useUserProfile';
import useUserGamePlay from '../hooks/useUserGamePlay';
import useLastOnlineTime from '../hooks/useLastOnlineTime';
import useLastSpin from '../hooks/useLastSpin';
import useSystemStore from '../stores/system.store';

const Navigations = () => {
  const { ready, authenticated, user } = usePrivy();

  useSystem();
  useUserProfile(ready, user);
  useUserGamePlay();
  useLastOnlineTime();
  useLastSpin();

  const configs = useSystemStore((state) => state.configs);

  const isLoading = !ready || !configs || configs?.disabledUrls?.includes(window.location.host);
  const isBlocked = configs?.disabledUrls?.includes(window.location.host);

  if (isLoading) return <Loading isBlocked={isBlocked} />;

  if (!authenticated) return <AuthRoutes />;

  return <MainRoutes />;
};

export default Navigations;
