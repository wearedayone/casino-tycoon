import { Box, Dialog, Typography, Button } from '@mui/material';
import CachedIcon from '@mui/icons-material/Cached';
import { useSnackbar } from 'notistack';

import useUserWallet from '../../../hooks/useUserWallet';

const SettingModalDeposit = ({ open, onBack, setMode }) => {
  const { enqueueSnackbar } = useSnackbar();
  const embeddedWallet = useUserWallet();

  const onCopyAddress = () => {
    navigator.clipboard.writeText(embeddedWallet?.address);
    enqueueSnackbar('Copied address', { variant: 'success' });
  };

  return (
    <Dialog
      maxWidth="sm"
      fullWidth
      open={open}
      onClose={() => {}}
      PaperProps={{
        sx: { borderRadius: 1, backgroundColor: 'transparent', boxShadow: 'none' },
      }}>
      <Box display="flex" flexDirection="column" gap={1}>
        <Box display="flex" flexDirection="column" bgcolor="white" borderRadius={1}>
          <Box py={1} sx={{ borderBottom: '1px solid #555' }}>
            <Typography fontSize={20} fontWeight={600} align="center">
              Deposit
            </Typography>
          </Box>
          <Box p={2} display="flex" flexDirection="column" gap={2}>
            <Typography fontSize={14} align="center">
              Deposit ETH or NFTs here
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              <Typography>Deposit ETH only</Typography>
              <Box
                px={2}
                py={1}
                border="1px solid black"
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap={2}
                sx={{ cursor: 'pointer' }}>
                <img src="/images/icons/eth.png" alt="eth" width={25} />
                <Box flex={1}>
                  <Typography fontSize={14}>Deposit on Mainnet</Typography>
                  <Typography fontSize={12} color="grey">
                    Layer 1 deposit
                  </Typography>
                </Box>
                <Typography fontSize={12}>Deposit</Typography>
              </Box>
            </Box>
            <Box>
              <Typography>Deposit ETH, $FIAT or NFTs</Typography>
              <Box
                px={2}
                py={1}
                border="1px solid black"
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap={2}
                onClick={onCopyAddress}
                sx={{ cursor: 'pointer' }}>
                <img src="/images/icons/copy.png" alt="eth" width={25} />
                <Box flex={1}>
                  <Typography fontSize={14}>Receive on Base</Typography>
                  <Typography fontSize={12} color="grey">{`${embeddedWallet?.address.slice(
                    0,
                    4
                  )}...${embeddedWallet?.address.slice(-4)}`}</Typography>
                </Box>
                <Typography fontSize={12}>Copy address</Typography>
              </Box>
            </Box>
            <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
              <Typography fontSize={14}>GangsterArena Wallet Balance: 0 ETH</Typography>
              <CachedIcon sx={{ fontSize: 18, cursor: 'pointer' }} />
            </Box>
          </Box>
        </Box>
        <Box display="flex" flexDirection="column" gap={2} bgcolor="white" borderRadius={2}>
          <Box display="flex" flexDirection="column" gap={1}>
            <Button variant="outlined" onClick={onBack} sx={{ color: 'black', textTransform: 'none' }}>
              Back
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default SettingModalDeposit;
