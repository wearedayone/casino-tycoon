import { Routes, Route, Navigate } from 'react-router-dom';

import Home from '../pages/Home';

const MainRoutes = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default MainRoutes;
