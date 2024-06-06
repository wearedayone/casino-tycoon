import { Routes, Route, Navigate } from 'react-router-dom';

import Login from '../pages/Login';
import Deposit from '../pages/Deposit';
import DepositUser from '../pages/Deposit/DepositUser';
import DepositSuccess from '../pages/Deposit/DepositSuccess';

const AuthRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/deposit/success" element={<DepositSuccess />} />
      <Route path="/deposit/user" element={<DepositUser />} />
      <Route path="/deposit" element={<Deposit />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AuthRoutes;
