import { Routes, Route, Navigate } from 'react-router-dom';

import Game from '../pages/Game';
import Deposit from '../pages/Deposit';
import DepositUser from '../pages/Deposit/DepositUser';
import DepositSuccess from '../pages/Deposit/DepositSuccess';

const MainRoutes = () => {
  return (
    <div>
      <Routes>
        <Route path="/game" element={<Game />} />
        <Route path="/deposit/success" element={<DepositSuccess />} />
        <Route path="/deposit/user" element={<DepositUser />} />
        <Route path="/deposit" element={<Deposit />} />
        <Route path="*" element={<Navigate to="/game" replace />} />
      </Routes>
    </div>
  );
};

export default MainRoutes;
