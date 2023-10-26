import { Box, Typography } from '@mui/material';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';

import useUserStore from '../../../stores/user.store';
import useSystemStore from '../../../stores/system.store';
import { formatter } from '../../../utils/numbers';

const Header = () => {
  const profile = useUserStore((state) => state.profile);
  const gamePlay = useUserStore((state) => state.gamePlay);
  const activeSeason = useSystemStore((state) => state.activeSeason);

  if (!profile || !gamePlay || !activeSeason) return null;

  const { tokenBalance, ETHBalance } = profile;
  const { numberOfMachines, numberOfWorkers } = gamePlay;
  const { machine, worker } = activeSeason;

  const totalDailyReward = numberOfMachines * machine.dailyReward + numberOfWorkers * worker.dailyReward;

  return (
    <Box p={2} display="flex" justifyContent="center" gap={2} sx={{ borderBottom: '1px solid #555' }}>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        gap={1}
        py={0.5}
        px={1}
        border="1px solid #555"
        borderRadius={2}
        bgcolor="white"
        sx={{
          '& img': {
            width: 24,
            aspectRatio: '1/1',
          },
        }}>
        <img src="/images/icons/sleep.png" alt="sleep" />
        <Typography fontWeight={600} align="center">
          {formatter.format(totalDailyReward)}/d
        </Typography>
      </Box>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        gap={1}
        py={0.5}
        px={1}
        border="1px solid #555"
        borderRadius={2}
        bgcolor="white"
        sx={{
          '& img': {
            width: 24,
            aspectRatio: '1/1',
          },
        }}>
        <img src="/images/icons/crown.png" alt="sleep" />
        <Typography fontWeight={600} align="center">
          {formatter.format(tokenBalance)}
        </Typography>
        <AddCircleOutlineRoundedIcon />
      </Box>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        gap={1}
        py={0.5}
        px={1}
        border="1px solid #555"
        borderRadius={2}
        bgcolor="white"
        sx={{
          '& img': {
            width: 24,
            aspectRatio: '1/1',
          },
        }}>
        <img src="/images/icons/ethereum.png" alt="sleep" />
        <Typography fontWeight={600} align="center">
          {formatter.format(ETHBalance)}
        </Typography>
        <AddCircleOutlineRoundedIcon />
      </Box>
    </Box>
  );
};

export default Header;
