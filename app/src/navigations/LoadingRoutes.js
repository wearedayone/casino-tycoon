import { Routes, Route, Navigate } from 'react-router-dom';

import Loading from '../pages/Loading';

const LoadingRoutes = () => {
  return (
    <Routes>
      <Route path="/loading" element={<Loading />} />
      <Route path="*" element={<Navigate to="/loading" replace />} />
    </Routes>
  );
};

export default LoadingRoutes;
