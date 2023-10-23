import { Box } from '@mui/material';
import LeaderboardOutlinedIcon from '@mui/icons-material/LeaderboardOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';

import IconButton from './IconButton';

const Bank = ({ openModal }) => {
  return (
    <Box flex={1} display="flex" gap={2} sx={{ borderBottom: '1px solid #555' }}>
      <Box px={2} pt={4} width={80} display="flex" flexDirection="column" justifyContent="space-between">
        <IconButton Icon={<SettingsOutlinedIcon sx={{ fontSize: 24 }} />} onClick={() => {}} />
        <img src="/images/tree.png" alt="tree" maxWidth={80} maxHeight="100%" />
      </Box>
      <Box flex={1} display="flex" justifyContent="center" alignItems="flex-end" gap={2}>
        <img src="/images/bank.png" alt="bank" width={180} maxWidth="90%" maxHeight="100%" />
      </Box>
      <Box px={2} py={4} width={80} display="flex" flexDirection="column" gap={2}>
        <IconButton Icon={<LeaderboardOutlinedIcon sx={{ fontSize: 24 }} />} onClick={() => {}} />
        <IconButton
          Icon={<TimelineOutlinedIcon sx={{ fontSize: 24 }} />}
          onClick={() => {
            openModal('PORTFOLIO');
          }}
        />
      </Box>
    </Box>
  );
};

export default Bank;
