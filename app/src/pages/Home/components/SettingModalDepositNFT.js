import { Box, Dialog, Typography, Button } from '@mui/material';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';

import RoundedButton from '../../../components/RoundedButton';
import Input from './Input';

const SettingModalDepositNFT = ({ open, onBack }) => {
  const transfer = () => {};

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
              Deposit NFT
            </Typography>
          </Box>
          <Box p={2} display="flex" flexDirection="column" gap={2}>
            <Typography fontSize={14} align="center">
              Deposit Gangster NFTs to your game.
            </Typography>
            <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
              <img src="/images/smile-face.png" alt="smile-face" maxWidth={100} />
              <Box width="150px" display="flex" alignItems="center" gap={1}>
                <RemoveRoundedIcon />
                <input
                  value={0}
                  style={{
                    border: '1px solid black',
                    borderRadius: 4,
                    outline: 'none',
                    textAlign: 'center',
                    padding: 8,
                    flex: 1,
                    fontSize: 24,
                    minWidth: 0,
                  }}
                />
                <AddRoundedIcon />
              </Box>
              <Typography fontSize={12} fontStyle="italic" align="center">
                Available units: 2
              </Typography>
            </Box>
            <Input placeholder="Enter Address" />
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

export default SettingModalDepositNFT;
