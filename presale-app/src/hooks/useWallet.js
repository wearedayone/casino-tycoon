import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { Web3Provider } from '@ethersproject/providers';

import environments from '../utils/environments';

const { NETWORK_ID } = environments;

const { ethereum } = window;
let provider = ethereum;
if (ethereum?.providers?.length) {
  provider = ethereum.providers?.find((item) => item.isMetaMask) || ethereum.providers[0];
}

const useWallet = () => {
  const navigate = useNavigate();
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

  const createUserRecord = async () => {
    if (!address) return;
    const message = `Welcome to Blast the Balloon!\n\nSign this message to create your account\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
    const signature = await signMessage(message);

    // call to server with signature
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
    } catch (err) {
      console.error(err);
      if (err.message && !err.message.includes('rejected')) {
        enqueueSnackbar(err.message, { variant: 'error' });
      }
    }

    setLoading(false);
  };

  const logout = () => {
    setAddress(null);
    navigate('/');
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

  useEffect(() => {
    init();
  }, []);

  return {
    initialized,
    loading,
    address,
    provider,
    checkNetwork,
    connectWallet,
    logout,
    signMessage,
    createUserRecord,
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
