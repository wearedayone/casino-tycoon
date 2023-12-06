import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrivyProvider } from '@privy-io/react-auth';

import './index.css';
import App from './App';
import InstallGuideModal from './components/InstallGuideModal';
import UpdateDetectedModal from './components/UpdateDetectedModal';
import SetWalletPasswordModal from './components/SetWalletPasswordModal';
import GameVersion from './components/GameVersion';
import environments from './utils/environments';

import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';

const { PRIVY_APP_ID } = environments;

const theme = createTheme({
  typography: {
    fontFamily: "'Wix Madefor Display', sans-serif",
  },
});

// default: 10s for stale time, 10m for cache time
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 10 * 1000, cacheTime: 10 * 60 * 1000 },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <PrivyProvider
      appId={PRIVY_APP_ID}
      onSuccess={(user) => {
        console.log('logged in', { user });
      }}
      config={{
        loginMethods: ['email', 'twitter'],
        embeddedWallets: {
          createOnLogin: 'all-users',
          noPromptOnSignature: true,
        },
        appearance: {
          // TODO: update logo
          theme: 'light',
          accentColor: '#1e90ff',
          logo: 'https://placehold.co/600x600/1e90ff/FFF?text=Gangster+Arena',
        },
      }}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SnackbarProvider
            maxSnack={3}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}>
            <ThemeProvider theme={theme}>
              <App />
              <InstallGuideModal />
              <UpdateDetectedModal />
              <SetWalletPasswordModal />
              <GameVersion />
            </ThemeProvider>
          </SnackbarProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </PrivyProvider>
  </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
