import { useState } from 'react';
import { Box, Dialog, Typography, Button, Slider } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';

import { formatter } from '../../../utils/numbers';
import BuyBonusModal from './BuyBonusModal';
import useSystemStore from '../../../stores/system.store';
import useUserStore from '../../../stores/user.store';

const maxPerPurchase = 10;

const HireGangsterModal = ({ open, onBack }) => {
  const activeSeason = useSystemStore((state) => state.activeSeason);
  const gamePlay = useUserStore((state) => state.gamePlay);
  const [quantity, setQuantity] = useState(0);
  const [mode, setMode] = useState('normal');

  const buy = () => {};

  if (!activeSeason || !gamePlay) return null;

  const { numberOfMachines } = gamePlay;
  const { machine, reversePool } = activeSeason;

  if (mode === 'buy-bonus') return <BuyBonusModal open onBack={() => setMode('normal')} />;

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
              Hire Gangsters
            </Typography>
          </Box>
          <Box p={2} display="flex" flexDirection="column" gap={2} sx={{ borderBottom: '1px solid #555' }}>
            <Box display="flex" gap={2}>
              <Box width="30%">
                <img src="/images/gangster.png" alt="gangster" width="100%" />
              </Box>
              <Box flex={1} display="flex" flexDirection="column" gap={0.5}>
                <Box p={1} border="1px solid black">
                  <Typography fontSize={14} fontWeight={600} align="center">
                    Gangsters owned: 0
                  </Typography>
                </Box>
                <Box>
                  <Typography fontSize={14} fontWeight={600}>
                    Balance Unit:
                  </Typography>
                  <Typography fontSize={14}>
                    Gangsters provide high $FIAT yields and gives moderate reputation.
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box display="flex" flexDirection="column" gap={1}>
              <Box
                px={2}
                py={1}
                border="1px solid black"
                display="flex"
                alignItems="center"
                justifyContent="space-between">
                <Typography fontWeight={600}>Earning Rate</Typography>
                <Box>
                  <Typography fontWeight={600} align="right">
                    {numberOfMachines * machine.dailyReward} $FIAT/s
                  </Typography>
                  <Typography fontSize={10} color="success.main" align="right">
                    +{(numberOfMachines + quantity) * machine.dailyReward} $FIAT/s
                  </Typography>
                </Box>
              </Box>
              <Box
                px={2}
                py={1}
                border="1px solid black"
                display="flex"
                alignItems="center"
                justifyContent="space-between">
                <Typography fontWeight={600}>Reputation</Typography>
                <Box>
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    <Typography fontWeight={600} align="right">
                      +{numberOfMachines * machine.networth}
                    </Typography>
                    <StarBorderRoundedIcon />
                  </Box>
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    <Typography fontSize={10} color="success.main" align="right">
                      +{(numberOfMachines + quantity) * machine.networth}
                    </Typography>
                    <StarBorderRoundedIcon sx={{ fontSize: 14, color: 'success.main' }} />
                  </Box>
                </Box>
              </Box>
              <Box
                px={2}
                py={1}
                border="1px solid black"
                display="flex"
                alignItems="center"
                justifyContent="space-between">
                <Box>
                  <Typography fontWeight={600}>Daily ROI</Typography>
                  <Typography fontSize={10} fontStyle="italic">
                    Daily $FIAT earning in ETH / Cost
                  </Typography>
                </Box>
                <Box>
                  <Typography fontWeight={600} align="right">
                    XXX%
                    {/* TODO: implement logic calculate ROI machine */}
                  </Typography>
                </Box>
              </Box>
              <Box height="40px" display="flex" alignItems="center" justifyContent="center" gap={1}>
                <Box height="100%" display="flex" alignItems="center">
                  <Typography fontSize={14} fontWeight={600}>
                    Buy Bonus:
                  </Typography>
                  <Box alignSelf="flex-start">
                    <InfoIcon sx={{ fontSize: 14 }} onClick={() => setMode('buy-bonus')} />
                  </Box>
                </Box>
                <img src="/images/icons/coin.png" alt="coin" width={20} />
                <Typography fontSize={14} fontWeight={600}>
                  {formatter.format((reversePool * 1) / 100)}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box p={2} display="flex" alignItems="center" gap={1}>
            <Typography fontWeight={600}>Qty:</Typography>
            <Box flex={1} px={1.5} pt={0.75}>
              <Slider
                min={0}
                max={maxPerPurchase}
                valueLabelDisplay="on"
                value={quantity}
                onChange={(_e, value) => setQuantity(value)}
                sx={{ color: 'black', width: '120px' }}
              />
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <img src="/images/icons/ethereum.png" alt="eth" width={20} />
              <Typography fontSize={14} fontWeight={600}>
                {formatter.format(machine.basePrice * quantity)} ETH
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box display="flex" flexDirection="column" gap={2} bgcolor="white" borderRadius={2}>
          <Box display="flex" flexDirection="column" gap={1}>
            <Button variant="outlined" onClick={buy} sx={{ color: 'black', textTransform: 'none' }}>
              Buy
            </Button>
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

export default HireGangsterModal;
