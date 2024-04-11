import { Routes, Route, Navigate } from 'react-router-dom';

import Twitter from '../pages/Twitter';
import VerifyTwitter from '../pages/Twitter/Verify';

const ValidationRoutes = () => {
  return (
    <div>
      <Routes>
        <Route path="/twitter" element={<Twitter />} />
        <Route path="/verify/twitter" element={<VerifyTwitter />} />
        <Route path="*" element={<Navigate to="/twitter" replace />} />
      </Routes>
    </div>
  );
};

export default ValidationRoutes;
