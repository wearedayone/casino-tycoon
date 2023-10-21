import { useState, useEffect } from 'react';

import useUserGamePlay from './useUserGamePlay';
import useUserMachine from './useUserMachine';
import useUserWorker from './useUserWorker';
import useUserBuilding from './useUserBuilding';

const useUserGame = () => {
  useUserGamePlay();
  useUserMachine();
  useUserWorker();
  useUserBuilding();
};

export default useUserGame;
