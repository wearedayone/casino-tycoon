import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Typography } from '@mui/material';

import { submitOauthData } from '../../services/twitter.service';

const VerifyTwitter = () => {
  const [status, setStatus] = useState('loading');
  const [searchParams] = useSearchParams();
  const oauth_token = searchParams.get('oauth_token');
  const oauth_verifier = searchParams.get('oauth_verifier');

  const submitTwitter = async () => {
    if (oauth_token && oauth_verifier) {
      try {
        await submitOauthData({ oauth_token, oauth_verifier });
        setStatus('success');
      } catch (err) {
        setStatus('error');
      }
    }
  };

  useEffect(() => {
    submitTwitter();
  }, [oauth_token, oauth_verifier]);

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
        <Box flex={1} display="flex" flexDirection="column" justifyContent="center" gap={3}>
          <Box
            flex={1}
            pt={5}
            mx="auto"
            width={{ xs: '100%', sm: '600px' }}
            display="flex"
            flexDirection="column"
            sx={{ maxWidth: '600px', '& img': { width: '100%' } }}>
            <img src="/images/logo.svg" />
          </Box>
          <Box px={3} flex={1} display="flex" flexDirection="column" justifyContent="center">
            <Typography fontSize={20} align="center" color="white">
              {status === 'loading'
                ? 'Verifying your Twitter...'
                : status === 'success'
                ? 'Twitter verified!'
                : 'Something error'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default VerifyTwitter;
