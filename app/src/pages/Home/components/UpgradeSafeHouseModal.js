import { useState } from 'react';
import { Box, Dialog, Typography, Button, Slider } from '@mui/material';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import { useSnackbar } from 'notistack';

import { formatter } from '../../../utils/numbers';
import { calculateNextBuildingBuyPriceBatch, estimateNumberOfBuildingCanBuy } from '../../../utils/formulas';
import useSystemStore from '../../../stores/system.store';
import useUserStore from '../../../stores/user.store';
import useSmartContract from '../../../hooks/useSmartContract';
import { create, validate } from '../../../services/transaction.service';

const UpgradeSafehouseModal = ({ open, onBack }) => {
  const { enqueueSnackbar } = useSnackbar();
  const activeSeason = useSystemStore((state) => state.activeSeason);
  const gamePlay = useUserStore((state) => state.gamePlay);
  const profile = useUserStore((state) => state.profile);
  const { buyWorkerOrBuilding } = useSmartContract();
  const [quantity, setQuantity] = useState(0);
  const [upgrading, setUpgrading] = useState(false);
  const buy = async () => {
    try {
      setUpgrading(true);
      const res = await create({ type: 'buy-building', amount: quantity });
      const { id, amount, value, type } = res.data;
      const receipt = await buyWorkerOrBuilding(amount, value, type);
      // for test only
      // const receipt = { status: 1, transactionHash: 'test-txn-hash' };
      if (receipt.status === 1) {
        await validate({ transactionId: id, txnHash: receipt.transactionHash });
      }
      enqueueSnackbar('Buy buildings successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
      console.error(err);
    } finally {
      setUpgrading(false);
    }
  };

  if (!activeSeason || !gamePlay) return null;

  const { numberOfBuildings } = gamePlay;
  const { building, buildingSold } = activeSeason;
  const estimateMaxPurchase = estimateNumberOfBuildingCanBuy(buildingSold, profile?.tokenBalance ?? 0);
  console.log({ buildingSold, estimateMaxPurchase });
  const estimatedPrice = calculateNextBuildingBuyPriceBatch(buildingSold, quantity);

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
              Upgrade Safehouse
            </Typography>
          </Box>
          <Box p={2} display="flex" flexDirection="column" gap={2} sx={{ borderBottom: '1px solid #555' }}>
            <Box display="flex" gap={2}>
              <Box width="30%">
                <img src="/images/house.png" alt="house" width="100%" />
              </Box>
              <Box flex={1} display="flex" flexDirection="column" gap={0.5}>
                <Box p={1} border="1px solid black">
                  <Typography fontSize={14} fontWeight={600} align="center">
                    Safehouse Upgrades: {gamePlay.numberOfBuildings}
                  </Typography>
                </Box>
                <Box>
                  <Typography fontSize={14} fontWeight={600}>
                    High Reputation Unit:
                  </Typography>
                  <Typography fontSize={14}>Safehouse gives no $FIAT but gives high reputation.</Typography>
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
                    0 $FIAT/s
                  </Typography>
                  <Typography fontSize={10} color="success.main" align="right">
                    +0 $FIAT/s
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
                      +{numberOfBuildings * building.networth}
                    </Typography>
                    <StarBorderRoundedIcon />
                  </Box>
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    <Typography fontSize={10} color="success.main" align="right">
                      +{(numberOfBuildings + quantity) * building.networth}
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
                    0.0%
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
          <Box p={2} display="flex" alignItems="center" gap={1}>
            <Typography fontWeight={600}>Qty:</Typography>
            <Box flex={1} px={1.5} pt={0.75}>
              <Slider
                min={0}
                max={estimateMaxPurchase}
                valueLabelDisplay="on"
                value={quantity}
                onChange={(_e, value) => setQuantity(value)}
                sx={{ color: 'black', width: '120px' }}
              />
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <img src="/images/icons/ethereum.png" alt="eth" width={20} />
              <Typography fontSize={14} fontWeight={600}>
                {formatter.format(estimatedPrice.total)} $FIAT
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box display="flex" flexDirection="column" gap={2} bgcolor="white" borderRadius={2}>
          <Box display="flex" flexDirection="column" gap={1}>
            <Button
              variant="outlined"
              onClick={buy}
              disabled={upgrading}
              sx={{ color: 'black', textTransform: 'none' }}>
              {upgrading ? 'Upgrading ...' : 'Upgrade'}
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

export default UpgradeSafehouseModal;
