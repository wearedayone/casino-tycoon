import MainRoutes from './MainRoutes';
import AuthRoutes from './AuthRoutes';
import useAppContext from '../contexts/useAppContext';

const Navigations = () => {
  const {
    walletState: { initialized, address },
  } = useAppContext();

  if (!initialized) return null;

  if (!address) return <AuthRoutes />;

  return <MainRoutes />;
};

export default Navigations;
