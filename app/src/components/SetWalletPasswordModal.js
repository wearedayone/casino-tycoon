import { Box, Typography, IconButton, useMediaQuery } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { usePrivy } from '@privy-io/react-auth';

import RoundedButton from './RoundedButton';
import useModalStore from '../stores/modal.store';
import { completeAskingWalletPassword } from '../services/user.service';

const SetWalletPasswordModal = () => {
  const { setWalletPassword } = usePrivy();
  const isSm = useMediaQuery('(max-width: 440px)');
  const openSetWalletPassword = useModalStore((state) => state.openSetWalletPassword);
  const setOpenSetWalletPassword = useModalStore((state) => state.setOpenSetWalletPassword);

  const onClose = () => {
    setOpenSetWalletPassword(false);
    completeAskingWalletPassword();
  };

  const onAddPassword = () => {
    setOpenSetWalletPassword(false);
    setWalletPassword()
      .then(console.log)
      .catch((err) => console.error(err))
      .finally(() => completeAskingWalletPassword());
  };

  if (!openSetWalletPassword) return null;

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent={isSm ? 'flex-end' : 'center'}
      alignItems="center"
      sx={{ backdropFilter: 'blur(3px)' }}>
      <Box
        width={isSm ? '100vw' : '360px'}
        p={2}
        bgcolor="white"
        borderRadius="24px"
        display="flex"
        flexDirection="column"
        gap={2}
        sx={{
          borderBottomLeftRadius: isSm ? 0 : '24px',
          borderBottomRightRadius: isSm ? 0 : '24px',
          maxWidth: isSm ? 'auto' : '90vw',
        }}>
        <Box display="flex" justifyContent="flex-end">
          <IconButton onClick={onClose}>
            <CloseRoundedIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
        <Typography align="center">Do you want to set password for your embedded wallet?</Typography>
        <Box display="flex" flexDirection="column" gap={1}>
          <RoundedButton label="Add password" sx={{ fontSize: 12 }} onClick={onAddPassword} />
          <RoundedButton label="Skip" color="error" sx={{ fontSize: 12 }} onClick={onClose} />
        </Box>
      </Box>
    </Box>
  );
};

export default SetWalletPasswordModal;
