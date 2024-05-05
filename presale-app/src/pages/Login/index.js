import { Box, Typography } from '@mui/material';

import Layout from '../../components/Layout';
import { tosLink, privacyLink } from '../../utils/links';
import useAppContext from '../../contexts/useAppContext';

const Login = () => {
  const {
    walletState: { connectWallet, loading },
    connectWalletState: { openConnectWalletModal, loading: loadingConnectWallet },
  } = useAppContext();

  return (
    <Layout>
      <Box
        flex={1}
        py={4}
        px={{ xs: 2, sm: 4, md: 6, lg: 8, xl: 10 }}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        gap={4}>
        <video autoPlay playsInline loop muted style={{ width: '74px', height: '74px' }}>
          <source src="/videos/coin-safari.mp4" type="video/mp4" />
          <source src="/videos/coin-vp9.mp4" type="video/webp" />
        </video>
        <Box>
          <Typography fontSize={{ xs: 20, md: 24, lg: 28, xl: 36 }} align="center" color="white">
            Your Uncharted
          </Typography>
          <Typography
            fontSize={{ xs: 20, md: 24, lg: 28, xl: 36 }}
            align="center"
            sx={{
              background: 'linear-gradient(to right, #904AFF 0%, #67D7F9 100%);',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
            journey begins now
          </Typography>
        </Box>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <Box
            height="58px"
            width="237px"
            maxWidth="100%"
            bgcolor="#904aff"
            display="flex"
            alignItems="center"
            justifyContent="center"
            sx={{
              clipPath:
                'polygon(0px 0%, calc(100% - 20px) 0%, 100% calc(10px), 100% calc(100% + 0px), calc(100% - 20px) 100%, calc(20px) 100%, 0% calc(100% - 10px), 0% calc(10px))',
              cursor: loading ? 'default' : 'pointer',
              transition: 'all ease 0.3s',
              '&:hover': {
                bgcolor: '#7b1fe4',
              },
            }}
            onClick={connectWallet}>
            <Typography fontWeight="300" color="white" textTransform="uppercase">
              {loading ? 'Connecting...' : 'Metamask'}
            </Typography>
          </Box>
          <Box
            height="58px"
            width="237px"
            maxWidth="100%"
            bgcolor="#68ABC4"
            display="flex"
            alignItems="center"
            justifyContent="center"
            sx={{
              clipPath:
                'polygon(0px 0%, calc(100% - 20px) 0%, 100% calc(10px), 100% calc(100% + 0px), calc(100% - 20px) 100%, calc(20px) 100%, 0% calc(100% - 10px), 0% calc(10px))',
              cursor: 'pointer',
              transition: 'all ease 0.3s',
              '&:hover': {
                bgcolor: '#5B96AC',
              },
            }}
            onClick={openConnectWalletModal}>
            <Typography fontWeight="300" color="white" textTransform="uppercase">
              {loadingConnectWallet ? 'Connecting...' : 'Connect wallet'}
            </Typography>
          </Box>
        </Box>
        <Box>
          <Typography fontSize={{ xs: 14 }} fontWeight={300} color="white" align="center">
            By using Uncharted, you agree to our <br />{' '}
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => window.open(tosLink)}>
              Terms of Service
            </span>{' '}
            &{' '}
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => window.open(privacyLink)}>
              privacy policy
            </span>
          </Typography>
        </Box>
      </Box>
    </Layout>
  );
};

export default Login;
