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
          backgroundImage: 'url(https://res.cloudinary.com/divb64juk/image/upload/v1709800611/gangster-arena/bg-login.png)',
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
            mt="20vh"
            width={{ xs: '100%', sm: '600px' }}
            display="flex"
            flexDirection="column"
            sx={{ maxWidth: '600px', '& img': { width: '100%' } }}>
            <img src="/images/logo.svg" />
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default Loading;
