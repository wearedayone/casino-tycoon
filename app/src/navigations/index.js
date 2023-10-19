import AuthRoutes from './AuthRoutes';
import MainRoutes from './MainRoutes';
import useSystem from '../hooks/useSystem';
import useAuth from '../hooks/useAuth';
import useUserStore from '../stores/user.store';

const Navigations = () => {
  useSystem();
  useAuth();

  const initialized = useUserStore((state) => state.initialized);
  const profile = useUserStore((state) => state.profile);

  if (!initialized) return null;

  if (!profile) return <AuthRoutes />;

  return <MainRoutes />;
};

export default Navigations;
