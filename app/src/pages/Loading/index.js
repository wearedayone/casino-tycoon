import { Box, CircularProgress, Typography } from '@mui/material';

const Loading = () => {
  return (
    <Box
      height="100vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
    >
      <CircularProgress />
      <Typography fontSize={18} fontWeight={600} align="center">
        Loading user informations...
      </Typography>
    </Box>
  );
};

export default Loading;
