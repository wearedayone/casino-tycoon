import { usePrivy } from '@privy-io/react-auth';

import AuthRoutes from './AuthRoutes';
import MainRoutes from './MainRoutes';
import LoadingRoutes from './LoadingRoutes';
import useSystem from '../hooks/useSystem';
import useUserProfile from '../hooks/useUserProfile';
import useUserGame from '../hooks/useUserGame';
import useUserStore from '../stores/user.store';
import useUserWallet from '../hooks/useUserWallet';

const Navigations = () => {
  const { ready, authenticated, user } = usePrivy();
  // logout();
  const initialized = useUserStore((state) => state.initialized);

  useSystem();
  useUserProfile(ready, user);
  useUserGame();
  useUserWallet();

  if (!ready) return null;

  if (!authenticated) return <AuthRoutes />;

  if (!initialized) return <LoadingRoutes />;

  return <MainRoutes />;
};

export default Navigations;
