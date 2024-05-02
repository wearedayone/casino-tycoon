import { useState } from 'react';
import { Box, Typography, useMediaQuery } from '@mui/material';

import useAppContext from '../contexts/useAppContext';
import { getOauthRequestToken } from '../services/twitter.service';

const UserAddress = () => {
  const isXs = useMediaQuery('(max-width: 500px)');
  const {
    walletState: { logout },
    connectWalletState: { logout: logoutConnectWallet },
    userState: { user },
  } = useAppContext();
  const [loading, setLoading] = useState(false);

  const addressText = `${user?.id?.slice(0, 4)}...${user?.id?.slice(-4)}`;
  const twitterVerified = user?.socials?.twitter?.verified;

  const verifyTwitter = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await getOauthRequestToken();
      const { oauth_token } = res.data;
      const url = `https://api.twitter.com/oauth/authenticate?oauth_token=${oauth_token}`;
      window.location.href = url;
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

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
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            width="45px"
            borderRadius="50%"
            overflow="hidden"
            sx={{
              aspectRatio: '1/1',
              '& img': {
                display: 'block',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
              },
            }}>
            <img src={user?.avatarURL || '/images/default-avatar.png'} alt="avatar" />
          </Box>
          {!isXs && <Typography color="white">{twitterVerified ? user?.username : addressText}</Typography>}
        </Box>
        <Box
          className="content"
          display="none"
          flexDirection="column"
          alignItems="center"
          gap={3}
          position="absolute"
          bottom={0}
          right={0}
          width={isXs ? 250 : 400}
          maxWidth="90vw"
          p={2}
          bgcolor="#1A0C31"
          border="1px solid #2a224e"
          sx={{ transform: 'translateY(100%)' }}>
          <Box display="flex" flexDirection={isXs ? 'column' : 'row'} alignItems="center" gap={1}>
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
              {twitterVerified ? user?.username : addressText}
            </Typography>
          </Box>
          <Box width="100%" display="flex" flexDirection="column" alignItems="center" gap={2}>
            {twitterVerified ? (
              <Box width="100%" display="flex" flexDirection="column" gap={2}>
                <Box height="1px" sx={{ background: 'linear-gradient(to right, #904AFF 0%, #67D7F9 100%)' }} />
                <Box
                  display="flex"
                  flexDirection={isXs ? 'column' : 'row'}
                  alignItems="center"
                  justifyContent="space-between">
                  <Typography color="white">X connected</Typography>
                  <Typography color="white">{user?.username}</Typography>
                </Box>
                <Box height="1px" sx={{ background: 'linear-gradient(to right, #904AFF 0%, #67D7F9 100%)' }} />
              </Box>
            ) : (
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
                onClick={verifyTwitter}>
                <Typography fontWeight="300" color="white" textTransform="uppercase">
                  Connect X
                </Typography>
              </Box>
            )}
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
              onClick={() => {
                logout();
                logoutConnectWallet();
              }}>
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
