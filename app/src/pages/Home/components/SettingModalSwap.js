import { Box, Dialog, Typography, Button } from '@mui/material';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';

import RoundedButton from '../../../components/RoundedButton';

const SettingModalSwap = ({ open, onBack }) => {
  const approve = () => {};

  return (
    <Dialog
      disablePortal
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
              Swap ETH/$FIAT
            </Typography>
          </Box>
          <Box p={2} display="flex" flexDirection="column" gap={2}>
            <Box position="relative" display="flex" flexDirection="column" gap={1}>
              <Box
                position="absolute"
                top="50%"
                left="50%"
                width={30}
                borderRadius="50%"
                border="1px solid black"
                bgcolor="white"
                display="flex"
                justifyContent="center"
                alignItems="center"
                sx={{ aspectRatio: '1/1', transform: 'translate(-50%, -50%)' }}>
                <ArrowDownwardRoundedIcon />
              </Box>
              <Box p={1} border="1px solid black" borderRadius={2} display="flex" flexDirection="column" gap={0}>
                <Box px={1} display="flex" justifyContent="space-between" alignItems="center">
                  <Typography fontSize={14}>You pay:</Typography>
                  <Typography fontSize={12}>0.051 balance</Typography>
                </Box>
                <Box px={1} display="flex" alignItems="center">
                  <input
                    value={0}
                    style={{ border: 'none', outline: 'none', fontSize: 24, fontWeight: 600, minWidth: 0 }}
                  />
                  <Box flexShrink={0} display="flex" alignItems="center" gap={0.5}>
                    <img src="/images/icons/ethereum.png" alt="eth" width={20} />
                    <Typography fontSize={12}>ETH</Typography>
                  </Box>
                </Box>
              </Box>
              <Box p={1} border="1px solid black" borderRadius={2} display="flex" flexDirection="column" gap={0}>
                <Box px={1}>
                  <Typography fontSize={14}>You receive:</Typography>
                </Box>
                <Box px={1} display="flex" alignItems="center">
                  <input
                    value={0}
                    style={{ border: 'none', outline: 'none', fontSize: 24, fontWeight: 600, minWidth: 0 }}
                  />
                  <Box flexShrink={0} display="flex" alignItems="center" gap={0.5}>
                    <img src="/images/icons/coin.png" alt="eth" width={20} />
                    <Typography fontSize={12}>$FIAT</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
            <RoundedButton
              label="Approve"
              onClick={approve}
              sx={{ fontSize: 10, fontWeight: 600, borderRadius: 2, textTransform: 'uppercase' }}
            />
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

export default SettingModalSwap;
