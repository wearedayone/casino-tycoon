import { createContext } from 'react';

import useWallet from '../hooks/useWallet';
import useMenu from '../hooks/useMenu';

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const walletState = useWallet();
  const menuState = useMenu();

  return <AppContext.Provider value={{ walletState, menuState }}>{children}</AppContext.Provider>;
};
