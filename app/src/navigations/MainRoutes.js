import { Routes, Route, Navigate } from 'react-router-dom';

import Game from '../pages/Game';

const MainRoutes = () => {
  return (
    <div>
      <Routes>
        <Route path="/game" element={<Game />} />
        <Route path="*" element={<Navigate to="/game" replace />} />
      </Routes>
    </div>
  );
};

export default MainRoutes;
