import { useState } from 'react';
import { Box, Typography } from '@mui/material';

import IconButton from './IconButton';

const ActionButtons = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Box
        display={open ? 'block' : 'none'}
        position="fixed"
        top={0}
        left={0}
        width="100vw"
        height="100vh"
        bgcolor="rgba(0, 0, 0, 0.2)"
        onClick={() => setOpen(false)}
      />
      <Box
        position="relative"
        display="flex"
        alignItems="center"
        justifyContent="center"
        gap={2}
        sx={{ transform: 'translateY(-2.5vh)' }}>
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
          display={open ? 'flex' : 'none'}
          flexDirection="column"
          sx={{ transform: 'translateY(-100%)' }}>
          <Box px={2} py={0.5} sx={{ borderBottom: '1px solid black' }}>
            <Typography fontWeight={600} align="center">
              Buy
            </Typography>
          </Box>
          <Box
            px={2}
            py={1}
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={0.5}
            sx={{ borderBottom: '1px solid black' }}>
            <img src="/images/house.png" alt="house" width={50} />
            <Typography align="center">Safehouse</Typography>
          </Box>
          <Box
            px={2}
            py={1}
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={0.5}
            sx={{ borderBottom: '1px solid black' }}>
            <img src="/images/gangster.png" alt="house" width={50} />
            <Typography align="center">Gangster</Typography>
          </Box>
          <Box
            px={2}
            py={1}
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={0.5}
            sx={{ borderBottom: '1px solid black' }}>
            <img src="/images/goon.png" alt="house" width={50} />
            <Typography align="center">Goon</Typography>
          </Box>
        </Box>
        <IconButton
          Icon={<img src="/images/clock.png" height={30} />}
          onClick={() => {}}
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
          onClick={() => setOpen(!open)}
          sx={{ aspectRatio: 'auto', height: 50, width: 100 }}
        />
      </Box>
    </>
  );
};

export default ActionButtons;
