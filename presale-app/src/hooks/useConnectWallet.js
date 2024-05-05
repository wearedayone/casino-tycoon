import { useState, useEffect } from 'react';
import { Web3Provider } from '@ethersproject/providers';
import { signInWithCustomToken, signOut } from 'firebase/auth';
import {
  useWeb3Modal,
  useWeb3ModalProvider,
  useWeb3ModalAccount,
  useDisconnect,
  useSwitchNetwork,
} from '@web3modal/ethers5/react';

import { auth } from '../configs/firebase.config';
import { getAuthToken } from '../services/auth.service';
import environments from '../utils/environments';

const { NETWORK_ID } = environments;

const useConnectWallet = (initialized, user) => {
  const [loading, setLoading] = useState(false);
  const { open } = useWeb3Modal();
  const {
    address: web3ModalAddress,
    chainId: web3ModalChainId,
    isConnected: web3ModalConnected,
  } = useWeb3ModalAccount();
  const { walletProvider: web3ModalWalletProvider } = useWeb3ModalProvider();
  const { disconnect: web3ModalDisconnect } = useDisconnect();
  const { switchNetwork } = useSwitchNetwork();

  const openConnectWalletModal = async () => {
    if (loading) return;
    try {
      await open();
    } catch (err) {
      open().catch((err) => console.log(err));
    }
  };

  const signMessageConnectWallet = async (message = '') => {
    try {
      const web3Provider = new Web3Provider(web3ModalWalletProvider);
      const signer = web3Provider.getSigner();

      const signature = await signer.signMessage(message);
      return signature;
    } catch (err) {
      console.error(err);
    }
  };

  const checkNetwork = async () => {
    if (web3ModalChainId !== NETWORK_ID) {
      await switchNetwork(NETWORK_ID);
    }
  };

  const signInWithFirebaseConnectWallet = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (
        web3ModalConnected &&
        web3ModalAddress &&
        web3ModalChainId &&
        web3ModalWalletProvider &&
        initialized &&
        !user
      ) {
        if (web3ModalChainId !== NETWORK_ID) {
          await switchNetwork(NETWORK_ID);
        }
        const message = `Welcome to Gangster NFT Presale!\n\nSign this message to create your account\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
        const signature = await signMessageConnectWallet(message);
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
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const logout = () => {
    web3ModalDisconnect().catch((err) => console.log(err));
    signOut(auth).catch((err) => console.log(err));
  };

  useEffect(() => {
    signInWithFirebaseConnectWallet();
  }, [
    web3ModalConnected,
    web3ModalAddress,
    web3ModalChainId,
    web3ModalWalletProvider,
    web3ModalAddress,
    initialized,
    user,
  ]);

  return {
    loading,
    address: web3ModalAddress,
    checkNetwork,
    openConnectWalletModal,
    logout,
    provider: web3ModalWalletProvider,
  };
};

export default useConnectWallet;
