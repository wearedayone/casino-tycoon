import { useEffect, useLayoutEffect } from 'react';
import { Box } from '@mui/material';
import { usePrivy } from '@privy-io/react-auth';

import usePrivyStore from '../../stores/privy.store';

const Login = () => {
  const setIsCustomContainer = usePrivyStore((state) => state.setIsCustomContainer);
  const { login } = usePrivy();

  useLayoutEffect(() => {
    setIsCustomContainer(true);
  }, []);

  useEffect(() => {
    addCssForPrivyDialog();
    login();
  }, []);

  const addCssForPrivyDialog = () => {
    const existedTag = document.querySelector('#privy-css');
    if (existedTag) return;

    const style = document.createElement('style');
    style.innerHTML = `
    :root {
      --privy-border-radius-lg: 15px;
      --privy-color-background: #fbf3e6;
      --privy-color-foreground-2: #29000b;
      --privy-color-foreground-4: #0005a0;
    }
    #privy-container{
      width: Wix Madefor Display;
    }
    #privy-container * {
      font-family: Wix Madefor Display;
    }
    #privy-container>div>div {
      position: relative;
      border-radius: var(--privy-border-radius-lg);
      border: 3px solid #4a65b9;
      margin: 3px;
      overflow: visible;
    }
    #privy-container>div>div::before {
      border-radius: calc(var(--privy-border-radius-lg) + 2px);
      content: " ";
      position: absolute;
      z-index: -1;
      top: -6px;
      left: -6px;
      right: -6px;
      bottom: -6px;
      background: #4ab0ef;
    }
    #privy-container>div>div button {
      background-color: #0f4efd;
      color: white;
      font-weight: 800;
    }
    /* START reduce spacing in email auth code screen */
    #privy-container>div>div>div>div>div>div {
      gap: 12px;
      margin-bottom: 0px;
    }
    #privy-container>div>div>div>div>div>div>div {
      padding-bottom: 0px;
    }
    /* END reduce spacing in email auth code screen */
    /* back button */
    #privy-container>div>div>div>div>div>div:not([class]) button {
      background-color: unset;
      color: unset;
    }
    /* Resend code btn in email flow */
    #privy-container>div>div>div>div>div button:not([class]) {
      background-color: unset;
      color: unset;
    }
    `;
    style.id = 'privy-css';
    console.log('added css');
    document.head.appendChild(style);
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
            justifyContent={'flex-end'}
            alignItems="center"
            gap={2}>
            <Box id="privy-container" maxWidth={'80%'} minWidth={'305px'} />
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default Login;
