import { Box, Typography } from '@mui/material';
import LeaderboardOutlinedIcon from '@mui/icons-material/LeaderboardOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';

import IconButton from './IconButton';

const Bank = ({ setOpeningModal }) => {
  return (
    <Box flex={1} display="flex" gap={2} sx={{ borderBottom: '1px solid #555' }}>
      <Box px={2} pt={4} width={80} display="flex" flexDirection="column" justifyContent="space-between">
        <IconButton Icon={<SettingsOutlinedIcon sx={{ fontSize: 24 }} />} onClick={() => setOpeningModal('SETTING')} />
        <img src="/images/tree.png" alt="tree" maxWidth={80} maxHeight="100%" />
      </Box>
      <Box flex={1} display="flex" justifyContent="center" alignItems="flex-end" gap={2}>
        <img src="/images/bank.png" alt="bank" width={180} maxWidth="90%" maxHeight="100%" />
      </Box>
      <Box px={2} py={4} width={80} display="flex" flexDirection="column" gap={2}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <IconButton
            Icon={<LeaderboardOutlinedIcon sx={{ fontSize: 24 }} />}
            onClick={() => setOpeningModal('LEADERBOARD')}
          />
          <Box display="flex" justifyContent="center" alignItems="center">
            <Typography>#80</Typography>
            <img src="/images/icons/down-arrow.png" width={10} />
          </Box>
        </Box>
        <IconButton
          Icon={<TimelineOutlinedIcon sx={{ fontSize: 24 }} />}
          onClick={() => setOpeningModal('PORTFOLIO')}
        />
      </Box>
    </Box>
  );
};

export default Bank;
