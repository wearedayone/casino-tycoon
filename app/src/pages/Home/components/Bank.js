import { Box, Typography } from '@mui/material';
import LeaderboardOutlinedIcon from '@mui/icons-material/LeaderboardOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded';

import IconButton from './IconButton';
import useSettingStore from '../../../stores/setting.store';

const Bank = ({ setOpeningModal }) => {
  const sound = useSettingStore((state) => state.sound);
  const setSound = useSettingStore((state) => state.setSound);

  return (
    <Box flex={1} display="flex" gap={2} sx={{ borderBottom: '1px solid #555' }}>
      <Box px={2} pt={4} width={80} display="flex" flexDirection="column" justifyContent="space-between">
        <Box display="flex" flexDirection="column" justifyContent="center" gap={3}>
          <IconButton
            Icon={<SettingsOutlinedIcon sx={{ fontSize: 24 }} />}
            onClick={() => setOpeningModal('SETTING')}
          />
          <IconButton
            Icon={
              sound === 'on' ? (
                <VolumeUpRoundedIcon sx={{ fontSize: 24 }} />
              ) : (
                <VolumeOffRoundedIcon sx={{ fontSize: 24 }} />
              )
            }
            onClick={() => setSound(sound === 'on' ? 'off' : 'on')}
          />
        </Box>
        <img src="/images/tree.png" alt="tree" maxWidth={80} maxHeight="100%" />
      </Box>
      <Box flex={1} display="flex" justifyContent="center" alignItems="flex-end" gap={2}>
        <img src="/images/bank.png" alt="bank" width={180} maxWidth="90%" maxHeight="100%" />
      </Box>
      <Box px={2} py={4} width={80} display="flex" flexDirection="column" gap={0}>
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
