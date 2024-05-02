import { Box } from '@mui/material';

const Loading = () => {
  return (
    <Box bgcolor="#1a0c31" height="100vh" overflow="auto" sx={{ scrollBehavior: 'smooth' }}>
      <Box
        minHeight="100vh"
        display="flex"
        flexDirection="column"
        sx={{
          backgroundImage: 'url(/images/background.png)',
          backgroundSize: '100% auto',
          backgroundRepeat: 'no-repeat',
        }}></Box>
    </Box>
  );
};

export default Loading;
