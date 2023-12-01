import { usePrivy } from '@privy-io/react-auth';

import AuthRoutes from './AuthRoutes';
import MainRoutes from './MainRoutes';
import LoadingRoutes from './LoadingRoutes';
import useSystem from '../hooks/useSystem';
import useUserProfile from '../hooks/useUserProfile';
import useUserGamePlay from '../hooks/useUserGamePlay';
import useUserStore from '../stores/user.store';

const Navigations = () => {
  const { ready, authenticated, user } = usePrivy();
  // logout();
  const initialized = useUserStore((state) => state.initialized);

  useSystem();
  useUserProfile(ready, user);
  useUserGamePlay();

  if (!ready) return null;

  if (!authenticated) return <AuthRoutes />;

  // if (!initialized) return <LoadingRoutes />;

  return <MainRoutes />;
};

export default Navigations;
