import { useState, useEffect } from 'react';
import { Web3Provider } from '@ethersproject/providers';
import { formatEther, parseEther } from '@ethersproject/units';
import { Contract } from '@ethersproject/contracts';

import environments from '../utils/environments';
import { toHexString } from '../utils/strings';
import useEthereumProvider from './useEthereumProvider';
import DepositLayerL1 from '../assets/abis/DepositLayerL1.json';

const { ethereum } = window || {};
const { LAYER_1_NETWORK_ID, DEPOSIT_LAYER_1_ADDRESS } = environments;

const useEthereum = () => {
  const [account, setAccount] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [wallet, setWallet] = useState('');
  const [balance, setBalance] = useState(0);
  const { browserProvider } = useEthereumProvider();

  const connectWallet = async ({ providerName } = {}) => {
    if (!browserProvider) {
      window.open('https://metamask.io/download');
      return;
    }

    setIsAuthenticating(true);
    providerName && setWallet(providerName);
    try {
      const provider = getProvider(providerName || wallet);
      console.log({ providerName, ethereum, provider }, provider.chainId);

      if (provider.chainId !== toHexString(LAYER_1_NETWORK_ID)) {
        console.log(provider.chainId, toHexString(LAYER_1_NETWORK_ID));

        try {
          console.log('start wallet_switchEthereumChain');
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: toHexString(LAYER_1_NETWORK_ID) }],
          });
          console.log('finish wallet_switchEthereumChain');
        } catch (err) {
          console.log('Error when process wallet_switchEthereumChain');
          console.log(err);
          if (err.code != 4001) {
            try {
              await provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: toHexString(LAYER_1_NETWORK_ID) }],
              });
            } catch (err) {
              console.log('Error when process wallet_addEthereumChain');
              console.log(err);
            }
          }
        }
      }

      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts.length) throw new Error('No authorized account found');
      console.log({ accounts });
      setAccount(accounts[0].toLowerCase());
    } catch (err) {
      console.error(err);
    }

    setIsAuthenticating(false);
  };

  const getProvider = (name) => {
    if (!browserProvider) return null;
    console.log('useEthereum > getProvider: ', { name, browserProvider });
    let provider;
    if (browserProvider?.providerMap && name) {
      provider = browserProvider?.providerMap?.get(name);
    } else if (browserProvider?.providerMap) provider = browserProvider?.providers.find((p) => p.connected);
    else provider = browserProvider;
    console.log('useEthereum > getProvider: return', { provider });
    return provider;
  };

  const getDepositContract = () => {
    const provider = getProvider(wallet);
    console.log('provider1', provider);
    if (!provider) return null;
    const web3Provider = new Web3Provider(provider, 'any');
    const signer = web3Provider.getSigner();
    const DepositContract = new Contract(DEPOSIT_LAYER_1_ADDRESS, DepositLayerL1.abi, signer);
    return DepositContract;
  };

  const deposit = async ({ address, amount }) => {
    const depositContract = getDepositContract();
    if (!depositContract) return;

    const txn = await depositContract.submitDepositProposal(address, { value: parseEther(amount) });
    const receipt = await txn.wait();

    return receipt;
  };

  useEffect(() => {
    const onWeb3AccountsChanged = async (accounts) => {
      if (accounts[0]) {
        const newAccount = accounts[0];
        setAccount(newAccount);
      } else {
        setWallet('');
        setAccount(null);
      }
    };

    const onWeb3ChainChanged = (networkId) => console.log({ networkId });

    if (!ethereum) return;

    let provider = getProvider(wallet);

    console.log({ wallet, provider });

    if (provider) {
      provider.on('accountsChanged', onWeb3AccountsChanged);
      provider.on('chainChanged', onWeb3ChainChanged);
    }

    return () => {
      if (provider) {
        provider.removeListener('accountsChanged', onWeb3AccountsChanged);
        provider.removeListener('chainChanged', onWeb3ChainChanged);
      }
    };

    // eslint-disable-next-line
  }, [wallet, browserProvider]);

  useEffect(() => {
    if (account && wallet) {
      const provider = getProvider(wallet);
      const etherProvider = new Web3Provider(provider);
      etherProvider
        .getBalance(account)
        .then((res) => {
          console.log('balance', res);
          setBalance(formatEther(res));
        })
        .catch((err) => console.error(err));
    }
  }, [wallet, account]);

  return {
    isAuthenticating,
    account,
    balance,
    connectWallet,
    deposit,
    isDepositing,
    setIsDepositing,
  };
};

export default useEthereum;