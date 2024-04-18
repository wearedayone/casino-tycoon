import { useLocation } from 'react-router-dom';
import { Box, Typography, alpha, useMediaQuery } from '@mui/material';

import userAgent from '../utils/userAgent';

const InstallGuideModal = () => {
  const superXs = useMediaQuery('(max-width: 400px)');
  const { pathname } = useLocation();

  const open =
    !pathname.startsWith('/deposit') &&
    userAgent.displayMode === 'browser' &&
    (userAgent.os === 'iOS' || (userAgent.os === 'Android' && !userAgent.isFirefox));

  if (!open) return null;

  if (userAgent.os === 'iOS')
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

  if (userAgent.os === 'Android')
    return (
      <Box
        zIndex={9998}
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
        <img src="/images/add-to-homepage-android.png" alt="add-to-home-page" />
        {/* <Box position="relative">
          <img src="/images/unsupported-browser-android.png" alt="unsupported-browser-android" />
          <Box
            position="absolute"
            top={0}
            left={0}
            width="100%"
            height="100%"
            p={3}
            pt={4}
            display="flex"
            flexDirection="column"
            justifyContent="center"
            gap={2}>
            <Typography
              align="center"
              fontSize={superXs ? 14 : { xs: 16, sm: 20, md: 32 }}
              fontFamily="WixMadeforDisplay">
              Players currently cannot play on Chromium Browsers, due to a 3rd party issue with X APIs.
            </Typography>
            <Typography
              align="center"
              fontSize={superXs ? 14 : { xs: 16, sm: 20, md: 32 }}
              fontFamily="WixMadeforDisplaySemiBold">
              We recommend desktop or{' '}
              <span
                style={{ textDecoration: 'underline', fontFamily: 'WixMadeforDisplaySemiBold', fontWeight: 600 }}
                onClick={() =>
                  window.open('https://play.google.com/store/apps/details?id=org.mozilla.firefox&hl=en', '_blank')
                }>
                Firefox
              </span>
            </Typography>
          </Box>
        </Box> */}
      </Box>
    );

  return null;
};

export default InstallGuideModal;
