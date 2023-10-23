import { Box } from '@mui/material';

import Header from './components/Header';
import Bank from './components/Bank';
import House from './components/House';
import ActionButtons from './components/ActionButtons';
import PortfolioModal from './components/PortfolioModal';
import { useState } from 'react';

const Home = () => {
  const [openPortfolioModal, setOpenPortfolioModal] = useState(false);

  const openModal = (modal) => {
    if (modal === 'PORTFOLIO') setOpenPortfolioModal(true);
  };

  return (
    <Box height="100vh" display="flex" flexDirection="column">
      <Box
        display="flex"
        flexDirection="column"
        height="45vh"
        sx={{
          backgroundImage: 'url(/images/buildings.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
        }}>
        <Header />
        <Bank openModal={openModal} />
      </Box>
      <Box
        height="30vh"
        sx={{
          backgroundImage: 'url(/images/road.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}></Box>
      <Box
        display="flex"
        flexDirection="column"
        gap={2}
        height="20vh"
        sx={{
          backgroundImage: 'url(/images/pavement.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
        <House />
      </Box>
      <Box height="5vh" bgcolor="#ddd" display="flex" flexDirection="column" justifyContent="center">
        <ActionButtons />
      </Box>
      <PortfolioModal open={openPortfolioModal} setOpenUpdate={setOpenPortfolioModal} />
    </Box>
  );
};

export default Home;
