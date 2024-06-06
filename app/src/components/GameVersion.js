import { Box, Typography } from '@mui/material';

import environments from '../utils/environments';

const { GAME_VERSION } = environments;

const GameVersion = () => {
  return (
    <Box position="fixed" top={16} left={16} zIndex={50}>
      <Typography fontSize={12} color="white">
        Game version: {GAME_VERSION}
      </Typography>
    </Box>
  );
};

export default GameVersion;
