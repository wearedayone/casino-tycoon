import { useLayoutEffect } from 'react';
import { Box, Typography } from '@mui/material';

import usePrivyStore from '../stores/privy.store';

const Loading = ({ isBlocked }) => {
  const setIsCustomContainer = usePrivyStore((state) => state.setIsCustomContainer);

  useLayoutEffect(() => {
    setIsCustomContainer(false);
  }, []);

  return (
    <>
      <Box
        width="100vw"
        minHeight="100vh"
        position="absolute"
        sx={{
          zIndex: -1,
          top: 0,
          backgroundImage: {
            xs: 'url(images/bg-login-vertical.webp)',
            sm: 'url(images/bg-login-5x4.webp)',
            md: 'url(images/bg-login.webp)',
          },
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}
      />
      <Box
        minHeight="100vh"
        p={2}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        bgcolor="rgba(0, 0, 0, 0.1)">
        <Box flex={1} display="flex" flexDirection="column" justifyContent="center" gap={10}>
          {isBlocked && (
            <Typography align="center" color="white" fontSize={24} fontFamily="WixMadeforDisplayExtraBold">
              Game is under temporary maintenance
            </Typography>
          )}
        </Box>
      </Box>
      {/* all routes directly handling a login success state must have this */}
      <Box
        id="privy-container"
        sx={{ width: 0, height: 0, visibility: 'hidden', '& *': { width: 0, height: 0, visibility: 'hidden' } }}
      />
    </>
  );
};

export default Loading;
