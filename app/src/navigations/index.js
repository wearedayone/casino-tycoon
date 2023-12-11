import { usePrivy } from '@privy-io/react-auth';

import AuthRoutes from './AuthRoutes';
import MainRoutes from './MainRoutes';
import Loading from '../components/Loading';
import useSystem from '../hooks/useSystem';
import useUserProfile from '../hooks/useUserProfile';
import useUserGamePlay from '../hooks/useUserGamePlay';

const Navigations = () => {
  const { ready, authenticated, user } = usePrivy();

  useSystem();
  useUserProfile(ready, user);
  useUserGamePlay();

  if (!ready) return <Loading />;

  if (!authenticated) return <AuthRoutes />;

  return <MainRoutes />;
};

export default Navigations;
