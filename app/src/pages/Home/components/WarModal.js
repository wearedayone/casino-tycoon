import { useEffect, useState } from 'react';
import { Box, Dialog, Typography, Button, Switch, styled, Divider } from '@mui/material';
import Countdown from 'react-countdown';

import { toggleWarStatus } from '../../../services/user.service';
import useUserStore from '../../../stores/user.store';

const WarModal = ({ open, onClose, onGoToHistory }) => {
  const gamePlay = useUserStore((state) => state.gamePlay);
  const [isWarEnabled, setWarEnabled] = useState(false);
  const [nextWar, setNextWar] = useState(new Date());

  useEffect(() => {
    const date = new Date();
    // tomorrow at 1AM
    date.setDate(date.getDate() + 1);
    date.setHours(1);
    date.setMinutes(0);
    date.setMilliseconds(0);

    setNextWar(date);
  }, [open]);

  useEffect(() => {
    setWarEnabled(gamePlay.war);
  }, [gamePlay.war]);

  const onToggleWar = async () => {
    const war = !isWarEnabled;
    await toggleWarStatus({ war });
    setWarEnabled(war);
  };

  const countdownRenderer = ({ hours, minutes, seconds }) => {
    return (
      <span>
        {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </span>
    );
  };

  return (
    <Dialog
      maxWidth="sm"
      fullWidth
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { borderRadius: 1, backgroundColor: 'transparent', boxShadow: 'none' },
      }}>
      <Box display="flex" flexDirection="column" gap={1}>
        <Box display="flex" flexDirection="column" bgcolor="white" borderRadius={1}>
          <Box py={1} sx={{ borderBottom: '1px solid #555' }}>
            <Typography fontSize={20} fontWeight={600} align="center">
              Daily Gang Wars
            </Typography>
          </Box>
          <Box p={2} display="flex" flexDirection="column" alignItems="center" gap={2}>
            <Typography fontSize={14}>Pick your strategy:</Typography>
            <Box display="flex" justifyContent="space-around" width="100%">
              <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                <Typography fontSize={13} fontWeight="bold">
                  Peace
                </Typography>
                <img src="/images/icons/peace.png" alt="" height={60} />
                <Typography fontSize={12} textAlign="center">
                  Play it safe:
                  <br /> No risk, no reward
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" pb={5}>
                <Typography fontSize={13} fontWeight="bold">
                  VS
                </Typography>
              </Box>
              <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                <Typography fontSize={13} fontWeight="bold">
                  War
                </Typography>
                <img src="/images/icons/war.png" alt="" height={60} />
                <Typography fontSize={12} textAlign="center">
                  Risk 10% of your <br /> forces to get bonus*
                </Typography>
                <Typography sx={{ mt: -0.5 }} fontSize={12} textAlign="center">
                  <strong>~ 2500</strong> $FIAT / d
                </Typography>
              </Box>
            </Box>
            <Box display="flex" flexDirection="column" alignItems="center" position="relative">
              <BigSwitch checked={isWarEnabled} onChange={onToggleWar} inputProps={{ 'aria-label': 'controlled' }} />
              <Typography
                sx={{ position: 'absolute', top: 4, left: 0, right: 0, [isWarEnabled ? 'mr' : 'ml']: 2.5 }}
                color="white"
                fontSize={12}
                textAlign="center"
                onClick={onToggleWar}>
                {isWarEnabled ? 'War' : 'Rest'}
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                <img src="/images/icons/clock.png" alt="" width={12} />
                <Typography fontSize={12} fontStyle="italic">
                  Next war: <Countdown date={nextWar} renderer={countdownRenderer} />
                </Typography>
              </Box>
            </Box>
            <Box width="100%" display="flex" flexDirection="column" gap={1}>
              <Divider flexItem />
              <Typography fontSize={14} textAlign="center">
                Potential War Outcomes
              </Typography>
              <Box width="100%" display="flex" gap={1}>
                <Box flex={1} display="flex" flexDirection="column" justifyContent="space-between" alignItems="center">
                  <Typography fontSize={12}>Outcome 1:</Typography>
                  <Box
                    width="100%"
                    display="flex"
                    flexDirection="column"
                    justifyContent="space-between"
                    bgcolor="#d9d9d9"
                    alignItems="center"
                    p={1}
                    gap={0.5}>
                    <Typography fontSize={12}>&lt;50% votes for War</Typography>
                    <Box display="flex" alignItems="center">
                      <Typography fontSize={22} fontWeight="bold">
                        2x
                      </Typography>
                      <img src="/images/icons/coin.png" alt="coin" width={20} height={20} />
                    </Box>
                    <Typography fontSize={12}>last 24h $FIAT yield*</Typography>
                  </Box>
                </Box>
                <Box flex={1} display="flex" flexDirection="column" justifyContent="space-between" alignItems="center">
                  <Typography fontSize={12}>Outcome 2:</Typography>
                  <Box
                    width="100%"
                    display="flex"
                    flexDirection="column"
                    justifyContent="space-between"
                    bgcolor="#d9d9d9"
                    alignItems="center"
                    p={1}
                    gap={0.5}>
                    <Typography fontSize={12}>&gt;= 50% votes for War</Typography>
                    <Box display="flex" alignItems="center">
                      <img src="/images/goon.png" alt="" width={32} style={{ transform: 'scaleX(-1)' }} />
                      <img src="/images/gangster.png" alt="" width={30} />
                    </Box>
                    <Typography fontSize={12}>10% chance dying</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
        <Box display="flex" flexDirection="column" gap={2} bgcolor="white" borderRadius={2}>
          <Box display="flex" flexDirection="column" gap={1}>
            <Button variant="outlined" onClick={onClose} sx={{ color: 'black', textTransform: 'none' }}>
              Back
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

const SWITCH_WIDTH = 80;
const SWITCH_HEIGHT = 26;
const THUMB_WIDTH = 20;

const BigSwitch = styled(Switch)(({ theme }) => ({
  width: SWITCH_WIDTH,
  height: SWITCH_HEIGHT,
  padding: 0,
  display: 'flex',
  '&:active': {
    '& .MuiSwitch-thumb': {
      width: THUMB_WIDTH * 1.25,
    },
    '& .MuiSwitch-switchBase.Mui-checked': {
      transform: `translateX(${SWITCH_WIDTH - THUMB_WIDTH * 1.25 - 4}px)`,
    },
  },
  '& .MuiSwitch-switchBase': {
    padding: 2,
    '&.Mui-checked': {
      transform: `translateX(${SWITCH_WIDTH - THUMB_WIDTH * 1.25 + 1}px)`,
      color: '#fff',
      '& + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: theme.palette.mode === 'dark' ? '#177ddc' : '#1890ff',
      },
    },
  },
  '& .MuiSwitch-thumb': {
    boxShadow: '0 2px 4px 0 rgb(0 35 11 / 20%)',
    width: THUMB_WIDTH,
    height: THUMB_WIDTH * 1.1,
    borderRadius: 6,
    transition: theme.transitions.create(['width'], {
      duration: 200,
    }),
  },
  '& .MuiSwitch-track': {
    borderRadius: 16 / 2,
    opacity: 1,
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.25)',
    boxSizing: 'border-box',
  },
}));

export default WarModal;
