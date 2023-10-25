import { Box } from '@mui/material';

import Header from './components/Header';
import Bank from './components/Bank';
import House from './components/House';
import ActionButtons from './components/ActionButtons';
import PortfolioModal from './components/PortfolioModal';
import SettingModal from './components/SettingModal';
import LeaderboardModal from './components/LeaderboardModal';
import { useState } from 'react';

const Home = () => {
  const [openingModal, setOpeningModal] = useState(null);

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
        <Bank setOpeningModal={setOpeningModal} />
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
      <PortfolioModal open={openingModal === 'PORTFOLIO'} setOpenUpdate={setOpeningModal} />
      <SettingModal open={openingModal === 'SETTING'} setOpenUpdate={setOpeningModal} />
      <LeaderboardModal open={openingModal === 'LEADERBOARD'} setOpenUpdate={setOpeningModal} />
    </Box>
  );
};

export default Home;
