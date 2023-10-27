import { Box, Dialog, Typography, Button } from '@mui/material';

import { CopyIcon } from '../../../components/Icons';
import useUserWallet from '../../../hooks/useUserWallet';
import useUserStore from '../../../stores/user.store';
import useSystemStore from '../../../stores/system.store';
import { formatter } from '../../../utils/numbers';
import { calculateMachineSellPrice } from '../../../utils/formulas';

const PortfolioModal = ({ open, setOpenUpdate }) => {
  const profile = useUserStore((state) => state.profile);
  const gamePlay = useUserStore((state) => state.gamePlay);
  const activeSeason = useSystemStore((state) => state.activeSeason);
  const embeddedWallet = useUserWallet();

  const onCopyAddress = () => {
    navigator.clipboard.writeText(embeddedWallet?.address);
  };

  if (!profile || !gamePlay || !activeSeason) return null;

  const { tokenBalance, ETHBalance } = profile;
  const { numberOfMachines } = gamePlay;
  const { machine } = activeSeason;

  // TODO: implement logic calculate token value in eth
  const tokenValueInETH = 0;
  const estimatedMachinesValueInETH = numberOfMachines * calculateMachineSellPrice(machine.basePrice);
  // TODO: implement logic calculate networth rank reward
  const networthRankReward = 0;
  const totalPortfolioValue = ETHBalance + tokenValueInETH + estimatedMachinesValueInETH + networthRankReward;

  const items = [
    {
      icon: '/images/icons/ethereum.png',
      text: 'Balance',
      value: ETHBalance,
    },
    {
      icon: '/images/icons/coin.png',
      text: `${formatter.format(tokenBalance)} FIAT`,
      value: tokenValueInETH,
    },
    {
      icon: '/images/icons/slot-machine.png',
      text: `${numberOfMachines} Machine NFTs`,
      value: estimatedMachinesValueInETH,
    },
    {
      icon: '/images/icons/crown_1.png',
      text: 'Networth Rank Rewards',
      value: networthRankReward,
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
              Portfolio
            </Typography>
          </Box>
          <Box p={2} display="flex" flexDirection="column" gap={2}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Box display="flex" flexDirection="column" justifyContent="center" justifyItems="center">
                <Typography fontSize={14} fontWeight={600}>
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
                {totalPortfolioValue} ETH
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                {items.map((item) => (
                  <Box key={item.text} display="flex" alignItems="center" gap={1}>
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
              onClick={() => setOpenUpdate(null)}
              sx={{ color: 'black', textTransform: 'none' }}>
              Back
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default PortfolioModal;
