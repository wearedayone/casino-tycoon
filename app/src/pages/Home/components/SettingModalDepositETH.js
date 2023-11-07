import { useState } from 'react';
import { Box, Dialog, Typography, Button } from '@mui/material';

import { CopyIcon } from '../../../components/Icons';
import RoundedButton from '../../../components/RoundedButton';

const SettingModalDepositETH = ({ open, onBack }) => {
  const [code, setCode] = useState('123456');

  const onCopyCode = () => {
    navigator.clipboard.writeText(code);
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
              Deposit ETH
            </Typography>
          </Box>
          <Box p={2} display="flex" flexDirection="column" gap={2}>
            <Typography fontSize={14} align="center">
              Visit https://xxx.com/deposit in your computer browser and use this code:{' '}
            </Typography>
            <Box display="flex" justifyContent="center" alignItems="center" gap={0.5} onClick={onCopyCode}>
              <Typography fontSize={32} fontWeight={600}>
                {code}
              </Typography>
              <CopyIcon sx={{ fontSize: 32, ml: 1 }} />
            </Box>
            <Box display="flex" justifyContent="center">
              <RoundedButton label="OK" onClick={() => {}} />
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

export default SettingModalDepositETH;
