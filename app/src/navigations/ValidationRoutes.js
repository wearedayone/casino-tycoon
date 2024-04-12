import { Routes, Route, Navigate } from 'react-router-dom';

import Twitter from '../pages/Twitter';
import VerifyTwitter from '../pages/Twitter/Verify';
import Deposit from '../pages/Deposit';
import DepositUser from '../pages/Deposit/DepositUser';
import DepositSuccess from '../pages/Deposit/DepositSuccess';

const ValidationRoutes = () => {
  return (
    <div>
      <Routes>
        <Route path="/twitter" element={<Twitter />} />
        <Route path="/verify/twitter" element={<VerifyTwitter />} />
        <Route path="/deposit/success" element={<DepositSuccess />} />
        <Route path="/deposit/user" element={<DepositUser />} />
        <Route path="/deposit" element={<Deposit />} />
        <Route path="*" element={<Navigate to="/twitter" replace />} />
      </Routes>
    </div>
  );
};

export default ValidationRoutes;
