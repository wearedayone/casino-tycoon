import { Box, Typography } from '@mui/material';

import useAppContext from '../contexts/useAppContext';

const UserAddress = () => {
  const {
    walletState: { logout },
    userState: { user },
  } = useAppContext();

  const addressText = `${user?.id?.slice(0, 4)}...${user?.id?.slice(-4)}`;

  return (
    <Box>
      <Box
        position="relative"
        sx={{
          cursor: 'pointer',
          '&:hover .content': {
            display: 'flex',
          },
        }}>
        <Typography color="white">{addressText}</Typography>
        <Box
          className="content"
          display="none"
          flexDirection="column"
          alignItems="center"
          gap={3}
          position="absolute"
          bottom={0}
          right={0}
          width={300}
          p={2}
          bgcolor="#1A0C31"
          border="1px solid #2a224e"
          sx={{ transform: 'translateY(100%)' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography fontSize="20px" color="white" align="center">
              Welcome back
            </Typography>
            <Typography
              fontSize={{ xs: 16, md: 20 }}
              align="center"
              sx={{
                background: 'linear-gradient(to right, #904AFF 0%, #67D7F9 100%);',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
              {addressText}
            </Typography>
          </Box>
          <Box display="flex" flexDirection="column" gap={2}>
            <Box
              height="54px"
              width="200px"
              bgcolor="#000"
              display="flex"
              alignItems="center"
              justifyContent="center"
              sx={{
                clipPath:
                  'polygon(0px 0%, calc(100% - 20px) 0%, 100% calc(10px), 100% calc(100% + 0px), calc(100% - 20px) 100%, calc(20px) 100%, 0% calc(100% - 10px), 0% calc(10px))',
                cursor: 'pointer',
                transition: 'all ease 0.3s',
                '&:hover': {
                  bgcolor: '#888',
                },
              }}
              onClick={() => {}}>
              <Typography fontWeight="300" color="white" textTransform="uppercase">
                Connect X
              </Typography>
            </Box>
            <Box
              height="54px"
              width="200px"
              bgcolor="#904aff"
              display="flex"
              alignItems="center"
              justifyContent="center"
              sx={{
                clipPath:
                  'polygon(0px 0%, calc(100% - 20px) 0%, 100% calc(10px), 100% calc(100% + 0px), calc(100% - 20px) 100%, calc(20px) 100%, 0% calc(100% - 10px), 0% calc(10px))',
                cursor: 'pointer',
                transition: 'all ease 0.3s',
                '&:hover': {
                  bgcolor: '#7b1fe4',
                },
              }}
              onClick={logout}>
              <Typography fontWeight="300" color="white" textTransform="uppercase">
                log out
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default UserAddress;
