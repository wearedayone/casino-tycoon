import { useContext } from 'react';

import { AppContext } from './app.context';

const useAppContext = () => {
  const context = useContext(AppContext);

  return context;
};

export default useAppContext;
