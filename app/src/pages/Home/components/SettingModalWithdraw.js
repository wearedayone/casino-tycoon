import { useState, useEffect } from 'react';
import { Box, Dialog, Typography, Button } from '@mui/material';

import useUserStore from '../../../stores/user.store';
import useSmartContract from '../../../hooks/useSmartContract';
import { formatter } from '../../../utils/numbers';

const SettingModalWithdraw = ({ open, onBack, setMode }) => {
  const { getStakedNFTBalance } = useSmartContract();
  const profile = useUserStore((state) => state.profile);
  const [gangsters, setGangsters] = useState(0);

  useEffect(() => {
    if (open) {
      getStakedNFTBalance(profile?.address)
        .then((data) => setGangsters(data))
        .catch((err) => console.error(err));
    }
  }, [open]);

  const items = [
    {
      title: '$FIAT',
      value: `${formatter.format(profile?.tokenBalance)} $FIAT`,
      onClick: () => setMode('withdraw-token'),
    },
    { title: 'ETH', value: `${formatter.format(profile?.ETHBalance)} ETH`, onClick: () => setMode('withdraw-eth') },
    {
      title: 'Gangster NFTs',
      value: `${gangsters} Gangsters`,
      onClick: () => setMode('withdraw-nft'),
    },
  ];

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
              Withdraw
            </Typography>
          </Box>
          <Box p={2} display="flex" flexDirection="column" gap={1}>
            {items.map((item) => (
              <Box
                key={item.title}
                p={2}
                border="1px solid black"
                borderRadius={2}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                gap={2}
                onClick={item.onClick}
                sx={{ cursor: 'pointer' }}>
                <Typography>{item.title}</Typography>
                <Typography>{item.value}</Typography>
              </Box>
            ))}
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

export default SettingModalWithdraw;
