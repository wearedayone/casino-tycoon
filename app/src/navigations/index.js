import AuthRoutes from './AuthRoutes';
import MainRoutes from './MainRoutes';
import useAuth from '../hooks/useAuth';
import useUserStore from '../stores/user.store';

const Navigations = () => {
  useAuth();
  const initialized = useUserStore((state) => state.initialized);
  const user = useUserStore((state) => state.user);

  if (!initialized) return null;

  if (!user) return <AuthRoutes />;

  return <MainRoutes />;
};

export default Navigations;
