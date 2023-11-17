import { useState, useEffect } from 'react';
import { Box, Dialog, Typography } from '@mui/material';

import { getPWADisplayMode, getUserOS } from '../utils/pwa';

const guideMap = {
  Android: {
    image: '/images/guides/ios.png',
    step1Text: 'Tap ellipse button',
    step2Text: 'Install App',
  },
  iOS: { image: '/images/guides/ios.png', step1Text: 'Tap on Share', step2Text: 'Add to Home Screen' },
};

const InstallGuideModal = () => {
  const [modalStatus, setModalStatus] = useState({
    open: false,
    os: null,
  });

  useEffect(() => {
    const displayMode = getPWADisplayMode();
    if (displayMode === 'browser') {
      const os = getUserOS();
      if (['iOS', 'Android'].includes(os)) {
        setModalStatus({ open: true, os });
      }
    }
  }, []);

  const guide = guideMap[modalStatus?.os] || {};

  return (
    <Dialog
      maxWidth="sm"
      fullWidth
      open={modalStatus.open}
      onClose={() => setModalStatus({ open: false, os: null })}
      PaperProps={{
        sx: {
          borderRadius: 4,
          position: 'relative',
          bgcolor: 'transparent',
          backgroundImage: 'url(/images/popup.png)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '100% 100%',
          overflow: 'visible',
        },
      }}>
      <Box position="absolute" width="75%" sx={{ top: -24, left: '50%', transform: 'translateX(-50%)' }}>
        <img src="/images/popup-title.png" width="100%" alt="" />
        <img
          src="/images/texts/add-to-home-page.png"
          width="100%"
          alt="Add to home page"
          style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}
        />
      </Box>
      <Box
        p={3}
        pt={{
          xs: 8,
          sm: 12,
        }}
        pb={4}>
        <Box display="flex" flexDirection="column" gap={3}>
          <Typography color="#29000b" fontWeight={700} align="center">
            To start playing, you need to add this website to your home screen.
          </Typography>
          <Box display="flex" gap={2} sx={{ '& .MuiTypography-root': { fontWeight: 800, fontSize: '1.2rem' } }}>
            <Box flex={1} display="flex" justifyContent="center" gap={0.75}>
              <Typography color="#29000b">Step </Typography>
              <Box bgcolor="#bf5837" borderRadius="50%" width="1.7rem" height="1.7rem">
                <Typography color="white" textAlign="center">
                  1
                </Typography>
              </Box>
            </Box>
            <Box flex={1} display="flex" justifyContent="center" gap={0.75}>
              <Typography color="#29000b">Step </Typography>
              <Box bgcolor="#bf5837" borderRadius="50%" width="1.7rem" height="1.7rem">
                <Typography color="white" textAlign="center">
                  2
                </Typography>
              </Box>
            </Box>
          </Box>
          <img src={guide.image} width="100%" alt="Tap on Share & Add to Home Screen" />
          <Box
            display="flex"
            gap={2}
            sx={{
              '& .MuiTypography-root': {
                fontWeight: 700,
                fontSize: '1.2rem',
                textAlign: 'center',
                color: '#29000b',
                lineHeight: '1.2em',
              },
            }}>
            <Box flex={1}>
              <Typography>{guide.step1Text}</Typography>
            </Box>
            <Box flex={1}>
              <Typography>{guide.step2Text}</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default InstallGuideModal;
