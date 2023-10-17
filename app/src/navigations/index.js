import AuthRoutes from './AuthRoutes';
import MainRoutes from './MainRoutes';

const Navigations = () => {
  // implement logic later using privy.io
  const initialized = true;
  const user = null;

  if (!initialized) return null;

  if (!user) return <AuthRoutes />;

  return <MainRoutes />;
};

export default Navigations;
