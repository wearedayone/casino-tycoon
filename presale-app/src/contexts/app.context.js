import { createContext } from 'react';

import useWallet from '../hooks/useWallet';
import useMenu from '../hooks/useMenu';
import useUser from '../hooks/useUser';
import usePhase from '../hooks/usePhase';
import useUserType from '../hooks/useUserType';

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

  return (
    <AppContext.Provider value={{ walletState, menuState, userState, phaseState, userTypeState }}>
      {children}
    </AppContext.Provider>
  );
};
