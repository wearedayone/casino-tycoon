import { Box, Typography } from '@mui/material';

const Loading = ({ isBlocked }) => {
  return (
    <>
      <Box
        width="100vw"
        minHeight="100vh"
        position="absolute"
        sx={{
          zIndex: -1,
          top: 0,
          backgroundImage: { xs: 'url(images/bg-login-vertical.webp)', md: 'url(images/bg-login.webp)' },
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
          <Box
            flex={1}
            mx="auto"
            pt={5}
            width={{ xs: '100%', sm: '600px' }}
            display="flex"
            flexDirection="column"
            sx={{ maxWidth: '600px', '& img': { width: '100%' } }}>
            <img src="/images/logo.svg" />
          </Box>
          {isBlocked && (
            <Typography align="center" color="white" fontSize={24} fontFamily="WixMadeforDisplayExtraBold">
              Game is under temporary maintenance
            </Typography>
          )}
        </Box>
      </Box>
    </>
  );
};

export default Loading;
