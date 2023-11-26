import { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { usePrivy } from '@privy-io/react-auth';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const Login = () => {
  const { login } = usePrivy();
  const [loading, setLoading] = useState(false);

  const addCssForPrivyDialog = () => {
    const existedTag = document.querySelector('#privy-css');
    if (existedTag) return;

    const style = document.createElement('style');
    style.innerHTML = `
      #privy-dialog { display: none }
    `;
    style.id = 'privy-css';

    document.head.appendChild(style);
  };

  const onClickLoginBtn = async () => {
    if (loading) return;
    setLoading(true);
    addCssForPrivyDialog();
    login();
    await delay(200);
    const privyDialog = document.querySelector('#privy-dialog');
    const buttons = [...privyDialog.querySelectorAll('button')];
    const twitterLoginButton = buttons.at(-1);
    twitterLoginButton?.click();
    setLoading(false);
  };

  return (
    <Box
      minHeight="100vh"
      bgcolor="#6123ff"
      p={2}
      display="flex"
      flexDirection="column"
      justifyContent="center"
      position="relative"
      sx={{
        backgroundImage: 'url(/images/bullet-holes.png)',
        backgroundSize: '80%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}>
      <Box flex={1} display="flex" flexDirection="column" justifyContent="center" gap={10}>
        <img src="/images/logo.svg" />
        <Box display="flex" flexDirection="column" gap={1}>
          <Typography fontSize={14} fontWeight={600} color="#ffbc00" sx={{ pl: 3 }}>
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
              // aspectRatio: 2.86 / 1,
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
            <Typography fontSize={12} color="#ffbc00" align="center">
              Protected by Privy
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box display="flex" flexDirection="column" justifyContent="flex-end" alignItems="center">
        <Typography
          fontSize={14}
          fontWeight={600}
          align="center"
          color="white"
          sx={{
            '& span': {
              cursor: 'pointer',
              color: '#ffbc00',
              textDecoration: 'underline',
            },
          }}>
          Need help? Troubleshoot <span>here</span>
        </Typography>
      </Box>
    </Box>
  );
};

export default Login;
