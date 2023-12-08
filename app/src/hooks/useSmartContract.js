import { Contract } from '@ethersproject/contracts';
import { usePrivy } from '@privy-io/react-auth';

import useUserWallet from './useUserWallet';
import useSystemStore from '../stores/system.store';
import gameContractAbi from '../assets/abis/GameContract.json';
import tokenAbi from '../assets/abis/Token.json';
import nftAbi from '../assets/abis/NFT.json';
import { formatter } from '../utils/numbers';
import environments from '../utils/environments';
import { parseEther, formatEther } from '@ethersproject/units';

const { NETWORK_ID } = environments;

const useSmartContract = () => {
  const { sendTransaction } = usePrivy();
  const embeddedWallet = useUserWallet();
  const activeSeason = useSystemStore((state) => state.activeSeason);

  const {
    tokenAddress: TOKEN_ADDRESS,
    gameAddress: GAME_CONTRACT_ADDRESS,
    nftAddress: NFT_ADDRESS,
  } = activeSeason || {};

  const loadedAssets = !!TOKEN_ADDRESS && !!GAME_CONTRACT_ADDRESS && !!NFT_ADDRESS && !!embeddedWallet;

  const withdrawToken = async (to, value) => {
    if (!loadedAssets) return;
    try {
      const privyProvider = await embeddedWallet.getEthereumProvider();
      const tokenContract = new Contract(TOKEN_ADDRESS, tokenAbi.abi, privyProvider.provider);

      const valueInWei = (value * 1e18).toLocaleString('fullwide', { useGrouping: false });
      const data = tokenContract.interface.encodeFunctionData('transfer', [to, valueInWei]);

      const unsignedTx = {
        to: TOKEN_ADDRESS,
        chainId: Number(NETWORK_ID),
        data,
      };

      const uiConfig = {
        header: `Send ${value.toLocaleString()} $FIAT to ${to}?`,
        description: '',
        buttonText: 'Transfer',
      };

      const receipt = await sendTransaction(unsignedTx, uiConfig);

      return receipt;
    } catch (err) {
      console.error(err.message);
    }
  };

  const withdrawETH = async (to, value) => {
    if (!loadedAssets) return;
    try {
      const unsignedTx = {
        to,
        chainId: Number(NETWORK_ID),
        // eslint-disable-next-line
        value: BigInt(Math.ceil(value * 1e18)),
      };

      const uiConfig = {
        header: `Send ${formatter.format(value)} ETH to ${to}?`,
        description: '',
        buttonText: 'Transfer',
      };
      const txReceipt = await sendTransaction(unsignedTx, uiConfig);
      return txReceipt;
    } catch (err) {
      console.error(err.message);
    }
  };

  const buyMachine = async (amount, value) => {
    if (!loadedAssets) return;
    const privyProvider = await embeddedWallet.getEthereumProvider();
    const gameContract = new Contract(GAME_CONTRACT_ADDRESS, gameContractAbi.abi, privyProvider.provider);

    const data = gameContract.interface.encodeFunctionData('mint', [1, amount]);

    const unsignedTx = {
      to: GAME_CONTRACT_ADDRESS,
      chainId: Number(NETWORK_ID),
      data,
      // eslint-disable-next-line
      value: BigInt(Math.ceil(value * 1e18)),
    };

    const uiConfig = {
      header: `Buy ${amount} gangsters with ${formatter.format(value)} ETH`,
      description: '',
      buttonText: 'Send transaction',
    };

    const receipt = await sendTransaction(unsignedTx, uiConfig);

    return receipt;
  };

  const buyGoon = async ({ amount, value, nonce, signature }) => {
    if (!loadedAssets) return;
    const privyProvider = await embeddedWallet.getEthereumProvider();
    const gameContract = new Contract(GAME_CONTRACT_ADDRESS, gameContractAbi.abi, privyProvider.provider);
    const tokenContract = new Contract(TOKEN_ADDRESS, tokenAbi.abi, privyProvider.provider);

    const res = await tokenContract.allowance(embeddedWallet.address, GAME_CONTRACT_ADDRESS);
    const approvedAmountInWei = res.toString();
    const approvedAmountInToken = Number(approvedAmountInWei.slice(0, approvedAmountInWei.length - 18));
    const needApprovedMore = approvedAmountInToken < value;

    if (needApprovedMore) {
      // eslint-disable-next-line no-undef
      const approveValueBigint = BigInt(parseEther(1e9 + '').toString());
      const data = tokenContract.interface.encodeFunctionData('approve', [GAME_CONTRACT_ADDRESS, approveValueBigint]);
      const unsignedTx = {
        to: TOKEN_ADDRESS,
        chainId: Number(NETWORK_ID),
        data,
      };
      await sendTransaction(unsignedTx);
    }

    // eslint-disable-next-line no-undef
    const valueBigint = BigInt(parseEther(value + '').toString());
    const data = gameContract.interface.encodeFunctionData('buyGoon', [amount, valueBigint, nonce, signature]);

    const unsignedTx = {
      to: GAME_CONTRACT_ADDRESS,
      chainId: Number(NETWORK_ID),
      data,
    };

    const uiConfig = {
      header: `Buy ${amount} gangsters with ${formatter.format(value)} ETH`,
      description: '',
      buttonText: 'Send transaction',
    };

    const receipt = await sendTransaction(unsignedTx, uiConfig);

    return receipt;
  };

  const buySafeHouse = async (amount, value, nonce, signature) => {
    if (!loadedAssets) return;
    const privyProvider = await embeddedWallet.getEthereumProvider();
    const gameContract = new Contract(GAME_CONTRACT_ADDRESS, gameContractAbi.abi, privyProvider.provider);
    const tokenContract = new Contract(TOKEN_ADDRESS, tokenAbi.abi, privyProvider.provider);

    const res = await tokenContract.allowance(embeddedWallet.address, GAME_CONTRACT_ADDRESS);
    const approvedAmountInWei = res.toString();
    const approvedAmountInToken = Number(approvedAmountInWei.slice(0, approvedAmountInWei.length - 18));
    const needApprovedMore = approvedAmountInToken < value;

    if (needApprovedMore) {
      // eslint-disable-next-line no-undef
      const approveValueBigint = BigInt(parseEther(1e9 + '').toString());
      const data = tokenContract.interface.encodeFunctionData('approve', [GAME_CONTRACT_ADDRESS, approveValueBigint]);
      const unsignedTx = {
        to: TOKEN_ADDRESS,
        chainId: Number(NETWORK_ID),
        data,
      };
      await sendTransaction(unsignedTx);
    }

    // eslint-disable-next-line no-undef
    const valueBigint = BigInt(parseEther(value + '').toString());
    const data = gameContract.interface.encodeFunctionData('buySafeHouse', [amount, valueBigint, nonce, signature]);
    const unsignedTx = {
      to: GAME_CONTRACT_ADDRESS,
      chainId: Number(NETWORK_ID),
      data,
    };

    const uiConfig = {
      header: `Buy ${amount} buildings with ${formatter.format(value)} FIAT`,
      description: '',
      buttonText: 'Send transaction',
    };

    const receipt = await sendTransaction(unsignedTx, uiConfig);

    return receipt;
  };

  const withdrawNFT = async (address, amount) => {
    if (!loadedAssets) return;
    const privyProvider = await embeddedWallet.getEthereumProvider();
    const nftContract = new Contract(NFT_ADDRESS, nftAbi.abi, privyProvider.provider);

    const approveData = nftContract.interface.encodeFunctionData('setApprovalForAll', [GAME_CONTRACT_ADDRESS, true]);

    const approveUnsignedTx = {
      to: NFT_ADDRESS,
      chainId: Number(NETWORK_ID),
      data: approveData,
    };

    // console.log({ NFT_ADDRESS, GAME_CONTRACT_ADDRESS, approveData });
    const approveReceipt = await sendTransaction(approveUnsignedTx);
    if (approveReceipt.status === 1) {
      const gameContract = new Contract(GAME_CONTRACT_ADDRESS, gameContractAbi.abi, privyProvider.provider);
      const data = gameContract.interface.encodeFunctionData('withdrawNFT', [address, 1, amount]);
      const unsignedTx = {
        to: GAME_CONTRACT_ADDRESS,
        chainId: Number(NETWORK_ID),
        data,
      };
      const receipt = await sendTransaction(unsignedTx);
      return receipt;
    }
  };

  const stakeNFT = async (address, amount) => {
    if (!loadedAssets) return;
    const privyProvider = await embeddedWallet.getEthereumProvider();
    const nftContract = new Contract(NFT_ADDRESS, nftAbi.abi, privyProvider.provider);

    const approveData = nftContract.interface.encodeFunctionData('setApprovalForAll', [GAME_CONTRACT_ADDRESS, true]);

    const approveUnsignedTx = {
      to: NFT_ADDRESS,
      chainId: Number(NETWORK_ID),
      data: approveData,
    };

    // console.log({ NFT_ADDRESS, GAME_CONTRACT_ADDRESS, approveData });
    const approveReceipt = await sendTransaction(approveUnsignedTx);
    if (approveReceipt.status === 1) {
      const gameContract = new Contract(GAME_CONTRACT_ADDRESS, gameContractAbi.abi, privyProvider.provider);
      const data = gameContract.interface.encodeFunctionData('depositNFT', [address, 1, amount]);
      const unsignedTx = {
        to: GAME_CONTRACT_ADDRESS,
        chainId: Number(NETWORK_ID),
        data,
      };
      const receipt = await sendTransaction(unsignedTx);
      return receipt;
    }
  };

  const getNFTBalance = async (address) => {
    if (!loadedAssets) return 0;
    const privyProvider = await embeddedWallet.getEthereumProvider();
    const nftContract = new Contract(NFT_ADDRESS, nftAbi.abi, privyProvider.provider);

    const res = await nftContract.balanceOf(address, 1);
    return Number(res.toString());
  };

  const getETHBalance = async (address) => {
    if (!loadedAssets) return 0;
    const privyProvider = await embeddedWallet.getEthereumProvider();
    const res = await privyProvider.provider.getBalance(address);
    return Number(formatEther(res.toString()));
  };

  const getStakedNFTBalance = async (address) => {
    if (!loadedAssets) return 0;
    const privyProvider = await embeddedWallet.getEthereumProvider();
    const gameContract = new Contract(GAME_CONTRACT_ADDRESS, gameContractAbi.abi, privyProvider.provider);

    const res = await gameContract.gangster(address);
    return Number(res.toString());
  };

  const isMinted = async (address) => {
    if (!loadedAssets) return false;
    const privyProvider = await embeddedWallet.getEthereumProvider();
    const gameContract = new Contract(GAME_CONTRACT_ADDRESS, gameContractAbi.abi, privyProvider.provider);

    const minted = await gameContract.mintedAddess(address);
    return minted;
  };

  return {
    buyMachine,
    buyGoon,
    buySafeHouse,
    withdrawETH,
    withdrawToken,
    withdrawNFT,
    stakeNFT,
    getNFTBalance,
    getETHBalance,
    getStakedNFTBalance,
    isMinted,
  };
};

export default useSmartContract;
