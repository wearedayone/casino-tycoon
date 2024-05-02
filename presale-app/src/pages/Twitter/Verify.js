import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';

import Layout from '../../components/Layout';
import { submitOauthData } from '../../services/twitter.service';

const VerifyTwitter = () => {
  const navigate = useNavigate();
  const submitting = useRef();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const oauth_token = searchParams.get('oauth_token');
  const oauth_verifier = searchParams.get('oauth_verifier');

  const submitTwitter = async () => {
    if (submitting.current) return;
    submitting.current = true;
    if (oauth_token && oauth_verifier) {
      try {
        await submitOauthData({ oauth_token, oauth_verifier });
        setStatus('success');
        setError('');
      } catch (err) {
        setStatus('error');
        setError(err.message);
      }
    }
    submitting.current = false;
  };

  useEffect(() => {
    submitTwitter();
  }, [oauth_token, oauth_verifier]);

  return (
    <Layout>
      <Box
        flex={1}
        py={4}
        px={{ xs: 2, sm: 4, md: 6, lg: 8, xl: 10 }}
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center">
        <Typography fontSize={20} fontWeight={700} align="center" color="white">
          {status === 'loading'
            ? 'Verifying your Twitter...'
            : status === 'success'
            ? 'Twitter verified!'
            : `Error: ${error}`}
        </Typography>
        {status !== 'loading' && (
          <Button variant="text" sx={{ textTransform: 'none', fontWeight: 500 }} onClick={() => navigate('/')}>
            Back to home
          </Button>
        )}
      </Box>
    </Layout>
  );
};

export default VerifyTwitter;
