import { useState } from 'react';
import { Box, Dialog, Typography, Button } from '@mui/material';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';

import RoundedButton from './RoundedButton';
import Input from './Input';
import useUserStore from '../../../stores/user.store';

const SettingModalWithdrawNFT = ({ open, onBack }) => {
  const profile = useUserStore((state) => state.profile);
  const gamePlay = useUserStore((state) => state.gamePlay);
  const [address, setAddress] = useState(profile?.address);
  const [quantity, setQuantity] = useState(0);

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
              Withdraw NFT
            </Typography>
          </Box>
          <Box p={2} display="flex" flexDirection="column" gap={2}>
            <Typography fontSize={14} align="center">
              Transfer Gangster NFTs to your wallet.
            </Typography>
            <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
              <img src="/images/smile-face.png" alt="smile-face" maxWidth={100} />
              <Box width="150px" display="flex" alignItems="center" gap={1}>
                <RemoveRoundedIcon sx={{ cursor: 'pointer' }} onClick={() => setQuantity(Math.max(0, quantity - 1))} />
                <input
                  value={quantity}
                  onChange={() => {}}
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
                <AddRoundedIcon
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setQuantity(Math.min(gamePlay?.numberOfMachines, quantity + 1))}
                />
              </Box>
              <Typography fontSize={12} fontStyle="italic" align="center">
                Available units: {gamePlay?.numberOfMachines}
              </Typography>
            </Box>
            <Input placeholder="Enter Address" value={address} onChange={(e) => setAddress(e.target.value)} />
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

export default SettingModalWithdrawNFT;
