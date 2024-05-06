import { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { usePrivy } from '@privy-io/react-auth';

import { getOauthRequestToken } from '../../services/twitter.service';

const Twitter = () => {
  const { logout } = usePrivy();
  const [loading, setLoading] = useState(false);

  const linkTwitter = async () => {
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
    <>
      <Box
        width="100vw"
        minHeight="100vh"
        position="absolute"
        sx={{
          zIndex: -1,
          top: 0,
          backgroundImage: {
            xs: 'url(images/bg-login-vertical.webp)',
            sm: 'url(images/bg-login-5x4.webp)',
            md: 'url(images/bg-login.webp)',
          },
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
        bgcolor="rgba(0, 0, 0, 0.1)">
        <Box flex={1} display="flex" flexDirection="column" justifyContent="center" gap={3}>
          <Box
            flex={1}
            mx="auto"
            width={{ xs: '100%', sm: '400px' }}
            display="flex"
            flexDirection="column"
            justifyContent="flex-end"
            gap={2}>
            <Box id="twitter-link-container">
              <Box p={2} bgcolor="#fbf3e7" display="flex" flexDirection="column" gap={3}>
                <Box position="relative">
                  <Box position="absolute" top={0} left={0} width="100%">
                    <img
                      src="/images/back-arrow.png"
                      alt="back"
                      width="5%"
                      style={{ cursor: 'pointer' }}
                      onClick={logout}
                    />
                  </Box>
                  <Typography fontWeight={600} align="center">
                    Link your socials
                  </Typography>
                </Box>
                <Box display="flex" flexDirection="column" alignItems="center">
                  <img src="/images/ga-twitter.png" width="60%" alt="logo" />
                </Box>
                <Box px={4}>
                  <Typography fontWeight={600} align="center">
                    Connect with X to play with friends and earn rewards.
                  </Typography>
                </Box>
                <Box mt={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={linkTwitter}
                    sx={{
                      borderRadius: '4%/24%',
                      backgroundColor: 'black',
                      backgroundImage: 'url(/images/button-black.png)',
                      backgroundSize: '100% 100%',
                      backgroundRepeat: 'no-repeat',
                      aspectRatio: 5.62 / 1,
                      boxShadow: 'none',
                      '&:hover': {
                        boxShadow: 'none',
                        backgroundColor: 'black',
                        backgroundImage: 'url(/images/button-black-pressed.png)',
                      },
                    }}>
                    <Box width="100%" display="flex" alignItems="center" gap={2}>
                      <img src="/images/icons/x.png" alt="x" width={30} />
                      <Box flex={1}>
                        <Typography align="left" fontSize={20} fontWeight={800} sx={{ textTransform: 'none' }}>
                          Link your Twitter
                        </Typography>
                      </Box>
                      <img src="/images/next-arrow.png" alt="next" width="5%" />
                    </Box>
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default Twitter;
