import { Box, Dialog, Typography, Button } from '@mui/material';
// import { usePrivy } from '@privy-io/react-auth';

import { CopyIcon } from '../../../components/Icons';
import useUserWallet from '../../../hooks/useUserWallet';

const PortfolioModal = ({ open, setOpenUpdate }) => {
  // const { logout } = usePrivy();
  const embeddedWallet = useUserWallet();

  const onCopyAddress = () => {
    navigator.clipboard.writeText(embeddedWallet?.address);
  };

  const items = [
    {
      icon: '/images/icons/ethereum.png',
      text: 'Balance',
      value: 0.51,
    },
    {
      icon: '/images/icons/coin.png',
      text: '100K CHIPS',
      value: 0.51,
    },
    {
      icon: '/images/icons/slot-machine.png',
      text: '15 Machine NFTs',
      value: 0.51,
    },
    {
      icon: '/images/icons/crown_1.png',
      text: 'Networth Rank Rewards',
      value: 0.51,
    },
  ];

  return (
    <Dialog
      maxWidth="sm"
      fullWidth
      open={open ?? false}
      onClose={() => {}}
      PaperProps={{
        sx: { borderRadius: 1, backgroundColor: 'transparent', boxShadow: 'none' },
      }}>
      <Box display="flex" flexDirection="column" gap={1}>
        <Box display="flex" flexDirection="column" bgcolor="white" borderRadius={1}>
          <Box sx={{ borderBottom: '1px solid #555' }}>
            <Typography fontSize={20} fontWeight={600} align="center">
              Portfolio
            </Typography>
          </Box>
          <Box display="flex" flexDirection="column" p={2} gap={2}>
            <Box display="flex" gap={1}>
              <Box display="flex" flexDirection="column" justifyContent="center" justifyItems="center">
                <Typography fontSize={14} align="left">
                  My Wallet:
                </Typography>
              </Box>
              <Button variant="text" color="info" onClick={() => onCopyAddress(false)}>
                <Typography fontSize={14} color="grey">
                  {embeddedWallet?.address && embeddedWallet?.address.length > 6
                    ? embeddedWallet?.address.substring(0, 6) +
                      '...' +
                      embeddedWallet?.address.substring(embeddedWallet?.address.length - 6)
                    : ''}
                </Typography>
                <CopyIcon sx={{ fontSize: 14, ml: 1 }} />
              </Button>
            </Box>
            <Box px={1} py={2} border="1px solid #555" borderRadius={4}>
              <Typography fontSize={14} align="center">
                Total portfolio value
              </Typography>
              <Typography fontSize={20} fontWeight={700} align="center">
                2.145 ETH
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                {items.map((item) => (
                  <Box display="flex" alignItems="center" gap={1}>
                    <img src={item.icon} alt="icon" width={23} height={23} />
                    <Box flex={1} display="flex" alignItems="center">
                      <Typography fontSize={14}>{item.text}</Typography>
                    </Box>
                    <Typography fontSize={14}>{item.value} ETH</Typography>
                  </Box>
                ))}
                <Typography fontSize={12} fontStyle="italic" align="center">
                  Estimates only based on latest prices
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
        <Box display="flex" flexDirection="column" gap={2} bgcolor="white" borderRadius={2}>
          <Box display="flex" flexDirection="column" gap={1}>
            <Button
              variant="outlined"
              onClick={() => setOpenUpdate(false)}
              sx={{ color: 'black', textTransform: 'none' }}>
              Back
            </Button>
          </Box>
        </Box>
        {/* <Box display="flex" flexDirection="column" gap={2} bgcolor="white" borderRadius={2}>
          <Box display="flex" flexDirection="column" gap={1}>
            <Button variant="outlined" color="error" onClick={logout} sx={{ textTransform: 'none' }}>
              Logout
            </Button>
          </Box>
        </Box> */}
      </Box>
    </Dialog>
  );
};

export default PortfolioModal;
