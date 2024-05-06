import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers5/react';
import { Toaster } from 'sonner';

import './index.css';
import './assets/styles/global.css';
import './assets/styles/animation.css';
import './assets/styles/content.css';
import './assets/styles/clip.css';
import './assets/styles/swiper.css';
import App from './App';
import { AppContextProvider } from './contexts/app.context';
import environments from './utils/environments';

const { NETWORK_ID, WALLET_CONNECT_PROJECT_ID, FRONTEND_URL } = environments;

const theme = createTheme({
  typography: {
    fontFamily: "'Poppins', sans-serif",
  },
});

// 1. Get projectId
const projectId = WALLET_CONNECT_PROJECT_ID;

// 2. Set chains
const blastSepolia = {
  chainId: 0xa0c71fd,
  name: 'Blast Sepolia',
  currency: 'ETH',
  explorerUrl: 'https://sepolia.blastscan.io',
  rpcUrl: 'https://sepolia.blast.io',
};

const blastMainnet = {
  chainId: 0xee,
  name: 'Blast Mainnet',
  currency: 'ETH',
  explorerUrl: 'https://blastscan.io',
  rpcUrl: 'https://rpc.blastblockchain.com',
};

// 3. Create a metadata object
const metadata = {
  name: 'Uncharted',
  description: 'Gangster NFT Presale',
  url: FRONTEND_URL, // origin must match your domain & subdomain
  icons: [`${FRONTEND_URL}/favicon.svg`],
};

// 4. Create Ethers config
const ethersConfig = defaultConfig({
  /*Required*/
  metadata,
  /*Optional*/
  enableEIP6963: true, // true by default
  enableInjected: true, // true by default
  enableCoinbase: true, // true by default
  rpcUrl: NETWORK_ID === blastMainnet.chainId ? blastMainnet.rpcUrl : blastSepolia.rpcUrl, // used for the Coinbase SDK
  defaultChainId: NETWORK_ID, // used for the Coinbase SDK
});

// 5. Create a Web3Modal instance
createWeb3Modal({
  ethersConfig,
  chains: [NETWORK_ID === blastMainnet.chainId ? blastMainnet : blastSepolia],
  projectId,
  enableAnalytics: true, // Optional - defaults to your Cloud configuration
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <SnackbarProvider
          maxSnack={3}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}>
          <AppContextProvider>
            <Toaster />
            <App />
          </AppContextProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
