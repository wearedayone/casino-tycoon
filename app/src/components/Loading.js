import { Box } from '@mui/material';

const Loading = () => {
  return (
    <>
      <Box
        width="100vw"
        minHeight="100vh"
        position="absolute"
        sx={{
          zIndex: -1,
          top: 0,
          backgroundImage: 'url(/images/bg-login.png)',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}
      />
      <Box
        minHeight="100vh"
        p={2}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        bgcolor="rgba(0, 0, 0, 0.2)">
        <Box flex={1} display="flex" flexDirection="column" justifyContent="center" gap={10}>
          <Box flex={1} mx="auto" mt="20vh" width={{ xs: '100%', sm: '600px' }} display="flex" flexDirection="column">
            <img src="/images/logo.svg" />
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default Loading;
