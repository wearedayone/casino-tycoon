import { Box, Typography, Button } from '@mui/material';
import LeaderboardOutlinedIcon from '@mui/icons-material/LeaderboardOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined';

import IconButton from './IconButton';
import useUserStore from '../../../stores/user.store';

const House = () => {
  const gamePlay = useUserStore((state) => state.gamePlay);
  const profile = useUserStore((state) => state.profile);

  return (
    <Box p={2} display="flex" gap={2} sx={{ borderBottom: '1px solid #555' }}>
      <Box py={2}>
        <IconButton
          Icon={<SettingsOutlinedIcon sx={{ fontSize: 32 }} />}
          onClick={() => {}}
        />
      </Box>
      <Box px={4} flex={1} display="flex" flexDirection="column" gap={2}>
        <Box
          position="relative"
          display="flex"
          justifyContent="center"
          sx={{
            '& img': {
              width: 200,
              maxWidth: '100%',
              minHeight: 70,
            },
          }}
        >
          <img src="/images/ribbon.png" alt="ribbon" />
          <Box
            position="absolute"
            top="50%"
            left="50%"
            display="flex"
            alignItems="center"
            gap={0.5}
            sx={{ transform: 'translate(-50%, -70%)' }}
          >
            <Typography fontSize={18} fontWeight={600}>
              {gamePlay?.networth}
            </Typography>
            <StarBorderOutlinedIcon />
          </Box>
        </Box>

        <Box py={1} px={2} border="1px solid black">
          <Typography fontWeight={600} align="center">
            {profile?.username} Gangster House
          </Typography>
        </Box>
        <img src="/images/house.png" alt="house" />
        <Box display="flex" justifyContent="center">
          <Button
            variant="outlined"
            color="inherit"
            sx={{ px: 3, fontWeight: 600 }}
          >
            Buy
          </Button>
        </Box>
      </Box>
      <Box py={2} display="flex" flexDirection="column" gap={2}>
        <IconButton
          Icon={<LeaderboardOutlinedIcon sx={{ fontSize: 32 }} />}
          onClick={() => {}}
        />
        <IconButton
          Icon={<TimelineOutlinedIcon sx={{ fontSize: 32 }} />}
          onClick={() => {}}
        />
      </Box>
    </Box>
  );
};

export default House;
