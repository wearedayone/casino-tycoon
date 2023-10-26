import { Routes, Route, Navigate } from 'react-router-dom';

import Home from '../pages/Home';
import useBackgroundMusic from '../hooks/useBackgroundMusic';

const MainRoutes = () => {
  const { setUserHasInteracted } = useBackgroundMusic();
  
  return (
    <div onClick={() => setUserHasInteracted(true)}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default MainRoutes;
