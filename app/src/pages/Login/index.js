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
    <Box minHeight="100vh" p={2} display="flex" flexDirection="column" justifyContent="center">
      <Box flex={1} display="flex" flexDirection="column" justifyContent="center" gap={4}>
        <Typography
          fontSize={48}
          fontWeight={700}
          fontFamily="'Inknut Antiqua', serif"
          align="center"
          lineHeight={1.25}>
          Gangster <br /> Arena
        </Typography>
        <Box display="flex" flexDirection="column" gap={1}>
          <Typography fontSize={14} fontWeight={600}>
            Connect with
          </Typography>
          <Box p={2} border="1px solid black" borderRadius={2} display="flex" flexDirection="column" gap={1}>
            <Typography fontSize={14} fontWeight={600}>
              Social
            </Typography>
            <Button
              fullWidth
              variant="contained"
              onClick={onClickLoginBtn}
              sx={{
                bgcolor: '#019EF7',
                boxShadow: 'none',
                height: '40px',
                '&:hover': {
                  boxShadow: 'none',
                },
              }}>
              <img src="/images/icons/twitter.png" alt="twitter" width={24} />
            </Button>
          </Box>
          <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
            <img src="/images/icons/privy.png" alt="privy" width={20} />
            <Typography fontSize={12} color="grey" align="center">
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
          sx={{
            '& span': {
              cursor: 'pointer',
              color: '#019EF7',
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
