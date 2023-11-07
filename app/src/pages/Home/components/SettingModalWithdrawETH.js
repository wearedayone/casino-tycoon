import { Box, Dialog, Typography, Button } from '@mui/material';

import RoundedButton from '../../../components/RoundedButton';
import Input from './Input';

const SettingModalWithdrawETH = ({ open, onBack }) => {
  const transfer = () => {};

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
              Withdraw ETH
            </Typography>
          </Box>
          <Box p={2} display="flex" flexDirection="column" gap={2}>
            <Typography fontSize={14} align="center">
              Transfer ETH from your wallet to another wallet on Base.
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              <Input placeholder="Enter Address" />
              <Input placeholder="Enter Amount" />
              <Typography fontSize={12} color="grey">
                Your balance: 0.05 ETH
              </Typography>
            </Box>
            <Box display="flex" justifyContent="center">
              <RoundedButton label="Transfer" onClick={transfer} sx={{ fontSize: 10 }} />
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

export default SettingModalWithdrawETH;
