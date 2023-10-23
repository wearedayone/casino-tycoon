import { Box, Typography } from '@mui/material';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';

import useUserStore from '../../../stores/user.store';

const House = () => {
  const gamePlay = useUserStore((state) => state.gamePlay);

  return (
    <Box
      height="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      sx={{
        '& .house': {
          display: 'block',
          width: 180,
          mb: '20vh',
        },
      }}>
      <Box position="relative">
        <img src="/images/ribbon.png" alt="ribbon" />
        <Box
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          display="flex"
          justifyContent="center"
          alignItems="center"
          gap={0.5}
          pb={1.25}>
          <Typography fontWeight={600} color="white">
            {gamePlay?.networth || 0}
          </Typography>
          <StarBorderRoundedIcon sx={{ color: 'white' }} />
        </Box>
      </Box>
      <img className="house" src="/images/house.png" alt="house" />
    </Box>
  );
};

export default House;
