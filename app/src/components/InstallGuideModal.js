import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Typography, Button, alpha } from '@mui/material';

import { getPWADisplayMode, getUserOS } from '../utils/pwa';

const InstallGuideModal = () => {
  const { pathname } = useLocation();
  const [deviceInfo, setDeviceInfo] = useState({
    displayMode: null,
    os: null,
  });

  useEffect(() => {
    const displayMode = getPWADisplayMode();
    const os = getUserOS();

    setDeviceInfo({ os, displayMode });
  }, []);

  const open =
    pathname !== '/deposit' &&
    ((deviceInfo.os === 'iOS' && deviceInfo.displayMode === 'browser') ||
      (deviceInfo.os === 'Android' && deviceInfo.displayMode === 'browser'));

  if (!open) return null;

  if (deviceInfo.os === 'iOS')
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        width="100vw"
        height="100vh"
        bgcolor={alpha('#000', 0.5)}
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{ '& img': { maxWidth: '80vw', maxHeight: '80vh' } }}>
        <img src="/images/add-to-homepage-ios.png" alt="add-to-home-page" />
      </Box>
    );

  if (deviceInfo.os === 'Android')
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        width="100vw"
        height="100vh"
        bgcolor={alpha('#000', 0.5)}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center">
        <Box position="relative" sx={{ '& img': { maxWidth: '80vw', maxHeight: '80vh' } }}>
          <img src="/images/add-to-homepage-android.png" alt="add-to-home-page" />
          <Box position="absolute" left={0} bottom={0} width="100%" px="10%" sx={{ transform: 'translateY(30px)' }}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => setDeviceInfo({ os: null, displayMode: null })}
              sx={{
                borderRadius: '4%/24%',
                backgroundColor: 'blue',
                backgroundImage: 'url(/images/button-blue-normal.png)',
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                aspectRatio: 5.62 / 1,
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: 'none',
                  backgroundColor: 'black',
                  backgroundImage: 'url(/images/button-blue-normal-pressed.png)',
                },
              }}>
              <Typography
                color="white"
                fontFamily="WixMadeforDisplayBold"
                fontSize={{ xs: 16, sm: 16, md: 24 }}
                sx={{ textTransform: 'none' }}
                // sx={{ WebkitTextStroke: '4px #0004A0', textStroke: '4px #0004A0' }}
              >
                Skip: Play on Browser
              </Typography>
            </Button>
          </Box>
        </Box>
        <Box mt="40px" width="700px" maxWidth="70vw">
          <Typography color="white" fontWeight={700} align="center" fontSize={{ xs: 16, sm: 16, md: 24 }}>
            Due to X APIs some Android devices may fail to authenticate. If this happens play via browser.
          </Typography>
        </Box>
      </Box>
    );

  return null;
};

export default InstallGuideModal;
