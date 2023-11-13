import { Routes, Route, Navigate } from 'react-router-dom';

import Home from '../pages/Home';
import Game from '../pages/Game';
import useBackgroundMusic from '../hooks/useBackgroundMusic';

const MainRoutes = () => {
  const { setUserHasInteracted } = useBackgroundMusic();

  return (
    <div onClick={() => setUserHasInteracted(true)}>
      <Routes>
        <Route path="/game" element={<Game />} />
        <Route path="/" element={<Home />} />
        <Route path="*" element={<Navigate to="/game" replace />} />
      </Routes>
    </div>
  );
};

export default MainRoutes;
