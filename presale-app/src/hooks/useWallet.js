import { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { Web3Provider } from '@ethersproject/providers';
import { signInWithCustomToken, signOut } from 'firebase/auth';

import { auth } from '../configs/firebase.config';
import { getAuthToken } from '../services/auth.service';
import environments from '../utils/environments';

const { NETWORK_ID } = environments;

const { ethereum } = window;
let provider = ethereum;
if (ethereum?.providers?.length) {
  provider = ethereum.providers?.find((item) => item.isMetaMask) || ethereum.providers[0];
}

const useWallet = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState(null);

  // utils
  const checkNetwork = async () => {
    if (!provider) return;

    if (provider.chainId !== NETWORK_ID) {
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: NETWORK_ID }],
        });
      } catch (err) {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [{ chainId: NETWORK_ID, ...BLAST_CHAINS[NETWORK_ID] }],
        });
      }
    }
  };

  const signMessage = async (message = '') => {
    try {
      if (!provider) {
        return;
      }

      const web3Provider = new Web3Provider(provider);
      const signer = web3Provider.getSigner();

      const signature = await signer.signMessage(message);
      return signature;
    } catch (err) {
      console.error(err);
    }
  };

  const signInWithFirebase = async () => {
    if (!address) return;
    const message = `Welcome to Gangster NFT Presale!\n\nSign this message to create your account\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
    const signature = await signMessage(message);
    if (!signature) {
      logout();
      return;
    }

    // call to server with signature
    const {
      data: { token },
    } = await getAuthToken({
      message,
      signature,
    });

    // 3. signIn & trigger onAuthStateChanged
    await signInWithCustomToken(auth, token);
  };

  // wallet functions
  const connectWallet = async () => {
    if (!provider || loading) return;

    setLoading(true);

    try {
      const accounts = await provider?.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts.length) throw new Error('No authorized account found');
      const newAddress = accounts[0].toLowerCase();

      setAddress(newAddress);
      await checkNetwork();

      await signInWithFirebase();
    } catch (err) {
      console.error(err);
      if (err.message && !err.message.includes('rejected')) {
        enqueueSnackbar(err.message, { variant: 'error' });
      }
    }

    setLoading(false);
  };

  const init = async () => {
    if (!provider) {
      setInitialized(true);
      return;
    }

    const accounts = await provider?.request({
      method: 'eth_accounts',
    });
    if (accounts[0]) {
      setAddress(accounts[0].toLowerCase());
    }
    setInitialized(true);

    provider?.on('accountsChanged', onWeb3AccountsChanged);

    provider?.on('chainChanged', (networkId) => {
      console.log({ networkId });
    });

    return () => provider?.removeListener('accountsChanged', onWeb3AccountsChanged);
  };

  const onWeb3AccountsChanged = (accounts) => {
    if (accounts[0]) {
      const newAddress = accounts[0].toLowerCase();
      setAddress(newAddress);
    } else {
      setAddress(null);
    }
  };

  const logout = () => {
    setAddress(null);
    signOut(auth).catch((err) => console.log(err));
  };

  useEffect(() => {
    init();
  }, []);

  return {
    initialized,
    loading,
    provider,
    connectWallet,
    logout,
    checkNetwork,
  };
};

export default useWallet;

const BLAST_CHAINS = {
  '0xee': {
    rpcUrls: ['https://rpc.blastblockchain.com'],
    chainName: 'Blast Mainnet',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: ['https://blastscan.io/'],
  },
  '0xa0c71fd': {
    rpcUrls: ['https://blast-sepolia.blockpi.network/v1/rpc/public'],
    chainName: 'Blast Sepolia Testnet',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: ['https://testnet.blastscan.io/'],
  },
};
