import { Box, Dialog, Typography, IconButton, Button } from '@mui/material';
import HighlightOffRoundedIcon from '@mui/icons-material/HighlightOffRounded';

import useModalStore from '../stores/modal.store';
import useSystemStore from '../stores/system.store';

import { isChrome } from 'react-device-detect';

import { getUserOS } from '../utils/pwa';
import { useState } from 'react';

const UpdateDetectedModal = () => {
  const openUpdate = useModalStore((state) => state.openUpdate);
  const setOpenUpdate = useModalStore((state) => state.setOpenUpdate);
  const configs = useSystemStore((state) => state.configs);
  const [os, setOS] = useState(getUserOS());
  const { appVersion } = configs || {};

  const update = () => {
    localStorage.setItem('appVersion', appVersion);
    caches.delete('images');
    caches.delete('audios');
    window.location.reload();
  };

  return (
    <Dialog
      maxWidth="sm"
      fullWidth
      open={(openUpdate && !(os === 'Android' && isChrome)) ?? false}
      onClose={() => {}}
      PaperProps={{
        sx: { borderRadius: 4 },
      }}>
      <Box p={2}>
        <Box display="flex" justifyContent="flex-end">
          <IconButton onClick={() => setOpenUpdate(false)}>
            <HighlightOffRoundedIcon />
          </IconButton>
        </Box>
        <Box display="flex" flexDirection="column" gap={2}>
          <Box>
            <Typography fontSize={20} fontWeight={600} align="center">
              New update detected
            </Typography>
            <Typography fontSize={14} align="center">
              App version: {appVersion}
            </Typography>
            <Typography fontSize={14} align="center">
              Current app version: {localStorage.getItem('appVersion') || 'unknown'}
            </Typography>
          </Box>
          <Box display="flex" flexDirection="column" gap={1}>
            <Button variant="contained" onClick={update}>
              Update
            </Button>
            <Button variant="outlined" color="error" onClick={() => setOpenUpdate(false)}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default UpdateDetectedModal;
