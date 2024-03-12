import { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { usePrivy } from '@privy-io/react-auth';
import * as Sentry from '@sentry/react';

import { getPWADisplayMode, getUserOS } from '../../utils/pwa';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const Login = () => {
  const { login } = usePrivy();
  const [loading, setLoading] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({
    os: getUserOS(),
    displayMode: getPWADisplayMode(),
  });

  const isAndroid = deviceInfo.os === 'Android';

  const addCssForPrivyDialog = () => {
    const existedTag = document.querySelector('#privy-css');
    if (existedTag) return;

    const style = document.createElement('style');
    style.innerHTML = `
      #privy-dialog { visibility: hidden }
    `;
    style.id = 'privy-css';
    console.log('added css');
    document.head.appendChild(style);
  };

  const onClickLoginBtn = async () => {
    if (loading) return;
    setLoading(true);
    try {
      addCssForPrivyDialog();
      login();
      await delay(200);
      const privyDialog = document.querySelector('#privy-dialog');
      console.log({ privyDialog });
      const buttons = [...privyDialog.querySelectorAll('button')];
      const twitterLoginButton = buttons.at(-1);
      twitterLoginButton?.click();
    } catch (err) {
      console.error(err);
      Sentry.captureException(err);
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
          backgroundImage:
            'url(https://res.cloudinary.com/divb64juk/image/upload/v1709800611/gangster-arena/bg-login.png)',
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
            width={{ xs: '100%', sm: '600px' }}
            display="flex"
            flexDirection="column"
            justifyContent="flex-end"
            sx={{ maxWidth: '600px', '& img': { width: '100%' } }}>
            <img src="/images/logo.svg" />
          </Box>
          <Box
            flex={1}
            mx="auto"
            width={{ xs: '100%', sm: '400px' }}
            display="flex"
            flexDirection="column"
            justifyContent="space-around">
            <Box display="flex" flexDirection="column" gap={1}>
              <Typography fontSize={14} fontWeight={600} color="white" sx={{ pl: 3 }}>
                Connect with
              </Typography>
              <Box
                p={{ xs: 2, sm: 5 }}
                px={3}
                pt={{ xs: 3, sm: 5 }}
                borderRadius={2}
                display="flex"
                flexDirection="column"
                gap={1}
                sx={{
                  backgroundImage: 'url(/images/login-small-frame.png)',
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                }}>
                <Typography fontSize={14} color="#7c2828" fontWeight={600}>
                  Twitter
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={onClickLoginBtn}
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
                  <img src="/images/icons/x.png" alt="x" width={30} />
                </Button>
              </Box>
              <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                <img src="/images/icons/privy.png" alt="privy" width={12} />
                <Typography fontSize={12} color="white" align="center">
                  Protected by Privy
                </Typography>
              </Box>
            </Box>
            <Typography
              fontSize={14}
              fontWeight={700}
              align="center"
              color="white"
              sx={{
                '& span': {
                  cursor: 'pointer',
                  textDecoration: 'underline',
                },
              }}>
              {isAndroid ? (
                <>
                  Due to X APIs some Android devices may fail to authenticate. If this happens play via Firefox browser.
                </>
              ) : (
                <>
                  Login Tips: Have X logged in and open in the background. <br />
                  Close and restart if needed.
                </>
              )}
              <br />
              <br />
              <a target="_" href="https://wiki.gangsterarena.com" style={{ color: '#FFF' }}>
                <span>Read more</span>
              </a>
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default Login;
