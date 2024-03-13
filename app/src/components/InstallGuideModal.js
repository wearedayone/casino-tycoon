import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, alpha } from '@mui/material';
import { isChrome } from 'react-device-detect';

import { getPWADisplayMode, getUserOS } from '../utils/pwa';

const InstallGuideModal = () => {
  const { pathname } = useLocation();
  const [deviceInfo, setDeviceInfo] = useState({
    displayMode: getPWADisplayMode(),
    os: getUserOS(),
  });

  const open =
    !pathname.startsWith('/deposit') &&
    deviceInfo.displayMode === 'browser' &&
    (deviceInfo.os === 'iOS' || (deviceInfo.os === 'Android' && isChrome));

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
        alignItems="center"
        justifyContent="center"
        sx={{ '& img': { maxWidth: '80vw', maxHeight: '80vh' } }}>
        <img src="/images/unsupported-browser-android.png" alt="unsupported-browser-android" />
      </Box>
    );

  return null;
};

export default InstallGuideModal;
