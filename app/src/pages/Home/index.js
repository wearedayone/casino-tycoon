import { Box } from '@mui/material';

import Header from './components/Header';
import Bank from './components/Bank';
import House from './components/House';
import ActionButtons from './components/ActionButtons';
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
    <Box height="100vh" display="flex" flexDirection="column">
      <Box
        display="flex"
        flexDirection="column"
        height="45vh"
        sx={{
          // aspectRatio: '1668/1320',
          // height: '45vh',
          backgroundImage: 'url(/images/buildings.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
        }}>
        <Header />
        <Bank callback={callback} />
      </Box>
      <Box
        height="30vh"
        sx={{
          // aspectRatio: '416/366',
          // height: '30vh',
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
          // aspectRatio: '1660/604',
          // height: '25vh',
          backgroundImage: 'url(/images/pavement.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
        <House />
      </Box>
      <Box height="5vh" bgcolor="#ddd" display="flex" flexDirection="column" justifyContent="center">
        <ActionButtons />
      </Box>
      <PortfolioDialog open={openPortfolioModal} setOpenUpdate={setOpenPortfolioModal} user={profile} />
    </Box>
  );
};

export default Home;
