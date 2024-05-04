import { createContext } from 'react';

import useWallet from '../hooks/useWallet';
import useMenu from '../hooks/useMenu';
import useUser from '../hooks/useUser';
import usePhase from '../hooks/usePhase';
import useUserType from '../hooks/useUserType';
import useEthPrice from '../hooks/useEthPrice';
import useConnectWallet from '../hooks/useConnectWallet';
import useSmartContract from '../hooks/useSmartContract';

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const walletState = useWallet();
  const menuState = useMenu();
  const userState = useUser();
  const userTypeState = useUserType(userState?.user?.username);
  const phaseState = usePhase({
    isWhitelisted: userTypeState.isWhitelisted,
    isFromSeasonOne: userTypeState.isFromSeasonOne,
    logged: !!userState.user,
  });
  const ethPriceState = useEthPrice();
  const connectWalletState = useConnectWallet(userState.initialized, userState.user);
  const provider =
    userState.user?.id === connectWalletState.address ? connectWalletState.provider : walletState.provider;
  const checkNetwork =
    userState.user?.id === connectWalletState.address ? connectWalletState.checkNetwork : walletState.checkNetwork;
  const smartContractState = useSmartContract({ provider, checkNetwork });

  return (
    <AppContext.Provider
      value={{
        walletState,
        connectWalletState,
        menuState,
        userState,
        phaseState,
        userTypeState,
        ethPriceState,
        smartContractState,
      }}>
      {children}
    </AppContext.Provider>
  );
};
