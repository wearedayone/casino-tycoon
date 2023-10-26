import { useCallback, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';

import IconButton from './IconButton';
import HireGangsterModal from './HireGangsterModal';
import HireGoonModal from './HireGoonModal';
import UpgradeSafehouseModal from './UpgradeSafeHouseModal';
import WarModal from './WarModal';
import WarHistoryModal from './WarHistoryModal';

const ActionButtons = () => {
  const [isGangWarMenuOpen, setGangWarOpen] = useState(false);
  const [isBuyMenuOpen, setBuyMenuOpen] = useState(false);

  const hasOneMenuOpen = useMemo(() => isGangWarMenuOpen || isBuyMenuOpen, [isGangWarMenuOpen, isBuyMenuOpen]);

  const closeMenus = useCallback(() => {
    setBuyMenuOpen(false);
    setGangWarOpen(false);
  }, []);

  return (
    <>
      <Box
        display={hasOneMenuOpen ? 'block' : 'none'}
        position="fixed"
        top={0}
        left={0}
        width="100vw"
        height="100vh"
        bgcolor="rgba(0, 0, 0, 0.2)"
        onClick={closeMenus}
      />
      <Box
        position="relative"
        display="flex"
        alignItems="center"
        justifyContent="center"
        gap={2}
        sx={{ transform: 'translateY(-2.5vh)' }}>
        <GangWarMenu isOpen={isGangWarMenuOpen} closeMenus={closeMenus} />
        <BuyMenu isOpen={isBuyMenuOpen} closeMenus={closeMenus} />
        <IconButton
          Icon={<img src="/images/clock.png" height={30} />}
          onClick={() => {
            closeMenus();
            setGangWarOpen(!isGangWarMenuOpen);
          }}
          sx={{ aspectRatio: 'auto', height: 50, width: 100 }}
        />
        <IconButton
          Icon={
            <Box>
              <Typography fontWeight={600} align="center">
                CLAIM
              </Typography>
              <Typography align="center">2K $FIAT</Typography>
            </Box>
          }
          onClick={() => {}}
          sx={{ aspectRatio: 'auto', height: 60, width: 120 }}
        />
        <IconButton
          Icon={<img src="/images/cash.png" height={30} />}
          onClick={() => {
            closeMenus();
            setBuyMenuOpen(!isBuyMenuOpen);
          }}
          sx={{ aspectRatio: 'auto', height: 50, width: 100 }}
        />
      </Box>
    </>
  );
};

const GangWarMenu = ({ isOpen, closeMenus }) => {
  const [openingModal, setOpeningModal] = useState(null);
  const gangWarOptions = [
    { image: '/images/war-history.png', onClick: () => setOpeningModal('HISTORY') },
    { image: '/images/war.png', onClick: () => setOpeningModal('WAR') },
  ];

  const closeModal = () => {
    setOpeningModal(null);
    closeMenus();
  };

  return (
    <Box
      position="absolute"
      top={0}
      left={0}
      mb={2}
      ml={2}
      bgcolor="white"
      borderRadius={2}
      border="1px solid black"
      overflow="hidden"
      width={100}
      display={isOpen ? 'flex' : 'none'}
      flexDirection="column"
      sx={{ transform: 'translateY(-100%)' }}>
      <WarModal open={openingModal === 'WAR'} onClose={closeModal} onGoToHistory={() => setOpeningModal('HISTORY')} />
      <WarHistoryModal
        open={openingModal === 'HISTORY'}
        onClose={closeModal}
        onGoToHistory={() => setOpeningModal('HISTORY')}
      />
      <Box px={2} py={0.5} sx={{ borderBottom: '1px solid black' }}>
        <Typography fontWeight={600} align="center">
          Brawl
        </Typography>
      </Box>
      {gangWarOptions.map((item, index) => (
        <Box
          key={index}
          px={2}
          py={1}
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={0.5}
          sx={{ borderBottom: '1px solid black' }}
          onClick={item.onClick}>
          <img src={item.image} alt={item.image} width={50} />
        </Box>
      ))}
    </Box>
  );
};

const BuyMenu = ({ isOpen, closeMenus }) => {
  const [openingModal, setOpeningModal] = useState(null);

  const buyMenuOptions = [
    { image: '/images/house.png', title: 'Safehouse', onClick: () => setOpeningModal('house') },
    { image: '/images/gangster.png', title: 'Gangster', onClick: () => setOpeningModal('gangster') },
    { image: '/images/goon.png', title: 'Goon', onClick: () => setOpeningModal('goon') },
  ];

  const closeModal = () => {
    setOpeningModal(null);
    closeMenus();
  };

  return (
    <Box
      position="absolute"
      top={0}
      right={0}
      mb={2}
      mr={2}
      bgcolor="white"
      borderRadius={2}
      border="1px solid black"
      overflow="hidden"
      width={100}
      display={isOpen ? 'flex' : 'none'}
      flexDirection="column"
      sx={{ transform: 'translateY(-100%)' }}>
      <HireGangsterModal open={openingModal === 'gangster'} onBack={closeModal} />
      <HireGoonModal open={openingModal === 'goon'} onBack={closeModal} />
      <UpgradeSafehouseModal open={openingModal === 'house'} onBack={closeModal} />

      <Box px={2} py={0.5} sx={{ borderBottom: '1px solid black' }}>
        <Typography fontWeight={600} align="center">
          Buy
        </Typography>
      </Box>
      {buyMenuOptions.map((item, index) => (
        <Box
          key={index}
          px={2}
          py={1}
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={0.5}
          sx={{ borderBottom: '1px solid black' }}
          onClick={item.onClick}>
          <img src={item.image} alt={item.title} width={50} />
          <Typography align="center">{item.title}</Typography>
        </Box>
      ))}
    </Box>
  );
};

export default ActionButtons;
