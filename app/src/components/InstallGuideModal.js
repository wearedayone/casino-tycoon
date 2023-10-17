import { useState, useEffect } from 'react';
import { Box, Grid, Dialog, Typography, IconButton } from '@mui/material';
import HighlightOffRoundedIcon from '@mui/icons-material/HighlightOffRounded';

import { getPWADisplayMode, getUserOS } from '../utils/pwa';

const guideSteps = {
  Android: [
    {
      text: 'Click ellipse button',
      img: '/images/guides/android-1.png',
    },
    { text: `Click "Install App"`, img: '/images/guides/android-2.png' },
  ],
  iOS: [
    {
      text: 'Tap on Share',
      img: '/images/guides/ios-1.png',
    },
    { text: `Add to Homescreen`, img: '/images/guides/ios-2.png' },
  ],
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

  const steps = guideSteps[modalStatus?.os || ''];

  return (
    <Dialog
      maxWidth="sm"
      fullWidth
      open={modalStatus.open}
      onClose={() => {}}
      PaperProps={{
        sx: { borderRadius: 4 },
      }}
    >
      <Box p={2}>
        <Box display="flex" justifyContent="flex-end">
          <IconButton onClick={() => setModalStatus({ open: false, os: null })}>
            <HighlightOffRoundedIcon />
          </IconButton>
        </Box>
        <Box display="flex" flexDirection="column" gap={1}>
          <Typography fontSize={20} fontWeight={600} align="center">
            Add to home page
          </Typography>
          <Typography fontWeight={600} align="center">
            To start playing, you need to add this website to your home screen.
          </Typography>
        </Box>
        <Grid container spacing={1} sx={{ marginTop: 4 }}>
          {steps?.map((step, index) => (
            <Grid key={step.text} item xs={6}>
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={1}
                sx={{
                  '& img': {
                    display: 'block',
                    width: '100%',
                  },
                }}
              >
                <Typography
                  fontWeight={600}
                  align="center"
                  sx={{ textDecoration: 'underline' }}
                >
                  Step {index + 1}
                </Typography>
                <Typography fontSize={12} fontWeight={600} align="center">
                  {step.text}
                </Typography>
                <img src={step.img} />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Dialog>
  );
};

export default InstallGuideModal;
