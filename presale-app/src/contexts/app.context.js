import { createContext } from 'react';

import useWallet from '../hooks/useWallet';
import useMenu from '../hooks/useMenu';
import useUser from '../hooks/useUser';

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const walletState = useWallet();
  const menuState = useMenu();
  const userState = useUser();

  return <AppContext.Provider value={{ walletState, menuState, userState }}>{children}</AppContext.Provider>;
};
