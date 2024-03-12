import { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Box, Typography, Button, alpha } from '@mui/material';

import { getPWADisplayMode, getUserOS } from '../utils/pwa';

const InstallGuideModal = () => {
  const { pathname } = useLocation();
  const [deviceInfo, setDeviceInfo] = useState({
    displayMode: getPWADisplayMode(),
    os: getUserOS(),
  });
  const [open, setOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const privyOathCode = searchParams.get('privy_oauth_code');

  useEffect(() => {
    if (['Android', 'iOS'].includes(deviceInfo.os) && deviceInfo.displayMode === 'browser') {
      if (!pathname.startsWith('/deposit')) {
        if (!privyOathCode) {
          setOpen(true);
        }
      }
    }
  }, [deviceInfo]);

  const skip = () => {
    setOpen(false);
  };

  if (!open) return null;

  if (deviceInfo.os === 'iOS')
    return (
      <Box
        zIndex={9999}
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
        zIndex={9999}
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
          <Box position="absolute" left={0} bottom={0} width="100%" px="10%" sx={{ transform: 'translateY(40%)' }}>
            <Button
              fullWidth
              variant="contained"
              onClick={skip}
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
            Due to X APIs some Android devices may fail to authenticate. If this happens play via Firefox browser.
          </Typography>
        </Box>
      </Box>
    );

  return null;
};

export default InstallGuideModal;
