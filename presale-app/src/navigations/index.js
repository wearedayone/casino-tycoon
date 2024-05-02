import Loading from '../components/Loading';
import MainRoutes from './MainRoutes';
import AuthRoutes from './AuthRoutes';
import useAppContext from '../contexts/useAppContext';

const Navigations = () => {
  const {
    walletState: { initialized: initializedWallet },
    userState: { initialized: initializedUser, user },
  } = useAppContext();

  if (!initializedWallet || !initializedUser) return <Loading />;

  if (!user) return <AuthRoutes />;

  return <MainRoutes />;
};

export default Navigations;
