import { Box } from '@mui/material';

import Header from './components/Header';
import House from './components/House';
import PortfolioDialog from './components/PortfolioDialog';
import { useState } from 'react';
import useUserStore from '../../stores/user.store';
const Home = () => {
  const [openPortfolioModal, setOpenPortfolioModal] = useState(false);
  const profile = useUserStore((state) => state.profile);
  function callback(modal) {
    if (modal === 'PORTFOLIO') setOpenPortfolioModal(true);
  }
  return (
    <Box>
      <Header />
      <House callback={callback} />
      <PortfolioDialog open={openPortfolioModal} setOpenUpdate={setOpenPortfolioModal} user={profile} />
    </Box>
  );
};

export default Home;
