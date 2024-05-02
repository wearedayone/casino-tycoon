import { Routes, Route, Navigate } from 'react-router-dom';

import Home from '../pages/Home';
import VerifyTwitter from '../pages/Twitter/Verify';

const MainRoutes = () => {
  return (
    <Routes>
      <Route path="/verify/twitter" element={<VerifyTwitter />} />
      <Route path="/" element={<Home />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default MainRoutes;
