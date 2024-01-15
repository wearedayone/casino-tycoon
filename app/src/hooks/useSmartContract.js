import { Contract } from '@ethersproject/contracts';
import { usePrivy } from '@privy-io/react-auth';
import { parseEther, formatEther } from '@ethersproject/units';
import RouterABI from '@uniswap/v2-periphery/build/IUniswapV2Router02.json';

import useUserWallet from './useUserWallet';
import useSystemStore from '../stores/system.store';
import gameContractAbi from '../assets/abis/GameContract.json';
import tokenAbi from '../assets/abis/Token.json';
import nftAbi from '../assets/abis/NFT.json';
import { formatter } from '../utils/numbers';
import environments from '../utils/environments';

const { NETWORK_ID } = environments;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const useSmartContract = () => {
  const { sendTransaction } = usePrivy();
  const embeddedWallet = useUserWallet();
  const activeSeason = useSystemStore((state) => state.activeSeason);

  const {
    tokenAddress: TOKEN_ADDRESS,
    gameAddress: GAME_CONTRACT_ADDRESS,
    nftAddress: NFT_ADDRESS,
    routerAddress: ROUTER_ADDRESS,
    wethAddress: WETH_ADDRESS,
  } = activeSeason || {};

  const loadedAssets = !!TOKEN_ADDRESS && !!GAME_CONTRACT_ADDRESS && !!NFT_ADDRESS && !!embeddedWallet;

  const withdrawToken = async (to, value) => {
    if (!loadedAssets) return;
    try {
      const privyProvider = await embeddedWallet.getEthereumProvider();
      const tokenContract = new Contract(TOKEN_ADDRESS, tokenAbi.abi, privyProvider.provider);

      // eslint-disable-next-line no-undef
      const valueInWei = BigInt(parseEther(value.toString()).toString());
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
      throw err;
    }
  };

  const withdrawETH = async (to, value) => {
    if (!loadedAssets) return;
    try {
      const unsignedTx = {
        to,
        chainId: Number(NETWORK_ID),
        // eslint-disable-next-line
        value: BigInt(parseEther(value.toString()).toString()),
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
      throw err;
    }
  };

  const buyMachine = async ({ amount, value, nonce, bonusAmount, referrerAddress, signature, mintFunction }) => {
    console.log('Start buyMachine');
    if (!loadedAssets) return;
    const privyProvider = await embeddedWallet.getEthereumProvider();
    const gameContract = new Contract(GAME_CONTRACT_ADDRESS, gameContractAbi.abi, privyProvider.provider);

    // eslint-disable-next-line no-undef
    const bonusBigint = BigInt(parseEther(bonusAmount.toString()).toString());
    const params = [1, amount, bonusBigint, nonce, signature];
    if (mintFunction === 'mintReferral') {
      if (!referrerAddress) mintFunction = 'mint';
      else params.splice(4, 0, referrerAddress);
    }
    const data = gameContract.interface.encodeFunctionData(mintFunction, params);

    const unsignedTx = {
      to: GAME_CONTRACT_ADDRESS,
      chainId: Number(NETWORK_ID),
      data,
      // eslint-disable-next-line
      value: BigInt(parseEther(value.toString()).toString()),
    };

    const uiConfig = {
      header: `Buy ${amount} gangster${amount > 1 ? 's' : ''} with ${formatter.format(value)} ETH`,
      description: '',
      buttonText: 'Send transaction',
    };
    console.log('Start sendTransaction');
    const receipt = await sendTransaction(unsignedTx, uiConfig);
    console.log('Finish buyMachine', receipt);
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
      await delay(1000);
    }

    // eslint-disable-next-line no-undef
    const valueBigint = BigInt(parseEther(value + '').toString());
    const data = gameContract.interface.encodeFunctionData('buyGoon', [amount, valueBigint, nonce, signature]);
    const unsignedTx = { to: GAME_CONTRACT_ADDRESS, chainId: Number(NETWORK_ID), data };

    const uiConfig = {
      header: `Buy ${amount} Goon${amount > 1 ? 's' : ''} with ${formatter.format(value)} FIAT`,
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
      await delay(1000);
    }

    // eslint-disable-next-line no-undef
    const valueBigint = BigInt(parseEther(value + '').toString());
    const data = gameContract.interface.encodeFunctionData('buySafeHouse', [amount, valueBigint, nonce, signature]);
    const unsignedTx = { to: GAME_CONTRACT_ADDRESS, chainId: Number(NETWORK_ID), data };

    const uiConfig = {
      header: `Upgrade Safehouse ${amount} time${amount > 1 ? 's' : ''} with ${formatter.format(value)} FIAT`,
      description: '',
      buttonText: 'Send transaction',
    };

    const receipt = await sendTransaction(unsignedTx, uiConfig);

    return receipt;
  };

  const withdrawNFT = async (address, amount) => {
    if (!loadedAssets) return;
    const privyProvider = await embeddedWallet.getEthereumProvider();

    const gameContract = new Contract(GAME_CONTRACT_ADDRESS, gameContractAbi.abi, privyProvider.provider);
    const data = gameContract.interface.encodeFunctionData('withdrawNFT', [address, 1, amount]);
    const unsignedTx = {
      to: GAME_CONTRACT_ADDRESS,
      chainId: Number(NETWORK_ID),
      data,
    };
    const receipt = await sendTransaction(unsignedTx);
    return receipt;
  };

  const stakeNFT = async (address, amount) => {
    if (!loadedAssets) return;
    const privyProvider = await embeddedWallet.getEthereumProvider();
    const nftContract = new Contract(NFT_ADDRESS, nftAbi.abi, privyProvider.provider);

    const isApprovedForAll = await nftContract.isApprovedForAll(embeddedWallet.address, GAME_CONTRACT_ADDRESS);

    let approveReceipt;
    if (!isApprovedForAll) {
      const approveData = nftContract.interface.encodeFunctionData('setApprovalForAll', [GAME_CONTRACT_ADDRESS, true]);

      const approveUnsignedTx = {
        to: NFT_ADDRESS,
        chainId: Number(NETWORK_ID),
        data: approveData,
      };

      approveReceipt = await sendTransaction(approveUnsignedTx);
      await delay(1000);
    }

    if (!approveReceipt || approveReceipt.status === 1) {
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

  const retire = async ({ value, nonce, signature }) => {
    console.log('Start retire');
    if (!loadedAssets) return;
    const privyProvider = await embeddedWallet.getEthereumProvider();
    const gameContract = new Contract(GAME_CONTRACT_ADDRESS, gameContractAbi.abi, privyProvider.provider);

    // eslint-disable-next-line
    const valueBigInt = BigInt(parseEther(value + '').toString());
    const params = [valueBigInt, nonce, signature];
    const data = gameContract.interface.encodeFunctionData('retired', params);

    const unsignedTx = {
      to: GAME_CONTRACT_ADDRESS,
      chainId: Number(NETWORK_ID),
      data,
    };

    const uiConfig = {
      header: `Retire now to receive ${formatter.format(value)} ETH`,
      description: '',
      buttonText: 'Send transaction',
    };
    console.log('Start sendTransaction');
    const receipt = await sendTransaction(unsignedTx, uiConfig);
    console.log('Finish retire', receipt);
    return receipt;
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
    const nftContract = new Contract(NFT_ADDRESS, nftAbi.abi, privyProvider.provider);

    const minted = await nftContract.mintedAddess(address);
    return minted;
  };

  const getSwapContractInfo = async () => {
    const privyProvider = await embeddedWallet.getEthereumProvider();

    const tokenAddress = TOKEN_ADDRESS;
    const routerAddress = ROUTER_ADDRESS;
    const wethAddress = WETH_ADDRESS;

    const routerContract = new Contract(routerAddress, RouterABI.abi, privyProvider.provider);
    const tokenContract = new Contract(tokenAddress, tokenAbi.abi, privyProvider.provider);

    return {
      routerAddress,
      tokenAddress,
      wethAddress,
      routerContract,
      tokenContract,
    };
  };

  const convertEthInputToToken = async (ethAmount) => {
    if (!loadedAssets) return 0;
    const { tokenAddress, routerContract, wethAddress } = await getSwapContractInfo();

    const amountIn = parseEther(`${ethAmount}`);
    const res = await routerContract.getAmountsOut(amountIn, [wethAddress, tokenAddress]);
    const amount = formatEther(res[1]);

    return { amount, priceImpact: 0 };
  };

  const convertEthOutputToToken = async (ethAmount) => {
    if (!loadedAssets) return 0;
    const { tokenAddress, routerContract, wethAddress } = await getSwapContractInfo();

    const amountOut = parseEther(`${ethAmount}`);
    const res = await routerContract.getAmountsIn(amountOut, [tokenAddress, wethAddress]);

    const amount = formatEther(res[0]);
    return { amount, priceImpact: 0 };
  };

  const convertTokenInputToEth = async (tokenAmount) => {
    if (!loadedAssets) return 0;
    const { tokenAddress, routerContract, wethAddress } = await getSwapContractInfo();

    const amountIn = parseEther(`${tokenAmount}`);
    const res = await routerContract.getAmountsOut(amountIn, [tokenAddress, wethAddress]);
    const amount = formatEther(res[1]);

    return { amount, priceImpact: 0 };
  };

  const convertTokenOutputToEth = async (tokenAmount) => {
    if (!loadedAssets) return 0;
    const { tokenAddress, routerContract, wethAddress } = await getSwapContractInfo();

    const amountOut = parseEther(`${tokenAmount}`);
    const res = await routerContract.getAmountsIn(amountOut, [wethAddress, tokenAddress]);

    const amount = formatEther(res[0]);
    return { amount, priceImpact: 0 };
  };

  const swapEthToToken = async (amount) => {
    if (!loadedAssets) return false;

    const { tokenAddress, routerContract, routerAddress, wethAddress } = await getSwapContractInfo();

    const { amount: tokenAmount } = await convertEthInputToToken(amount);

    const paths = [wethAddress, tokenAddress];
    const deadline = Math.floor(Date.now() / 1000 + 10 * 60);
    const params = [0, paths, embeddedWallet.address, deadline];

    const data = routerContract.interface.encodeFunctionData(
      'swapExactETHForTokensSupportingFeeOnTransferTokens',
      params
    );
    const unsignedTx = {
      to: routerAddress,
      chainId: Number(NETWORK_ID),
      data,
      // eslint-disable-next-line
      value: BigInt(parseEther(`${amount}`).toString()),
    };
    const receipt = await sendTransaction(unsignedTx);

    return { receipt, receiveAmount: tokenAmount };
  };

  const swapTokenToEth = async (amount) => {
    if (!loadedAssets) return false;

    const { tokenAddress, routerAddress, routerContract, wethAddress, tokenContract } = await getSwapContractInfo();

    const amountIn = parseEther(`${amount}`);
    const { amount: ethAmount } = await convertTokenInputToEth(amount);

    const res = await tokenContract.allowance(embeddedWallet.address, routerAddress);
    const approvedAmountInWei = res.toString();
    const approvedAmountInToken = Number(approvedAmountInWei.slice(0, approvedAmountInWei.length - 18));
    const needApprovedMore = approvedAmountInToken < amount;

    if (needApprovedMore) {
      // eslint-disable-next-line no-undef
      const approveValueBigint = BigInt(parseEther(1e9 + '').toString());
      const data = tokenContract.interface.encodeFunctionData('approve', [routerAddress, approveValueBigint]);
      const unsignedTx = {
        to: tokenAddress,
        chainId: Number(NETWORK_ID),
        data,
      };
      await sendTransaction(unsignedTx);
      await delay(1000);
    }

    const paths = [tokenAddress, wethAddress];
    const deadline = Math.floor(Date.now() / 1000 + 10 * 60);
    const params = [amountIn, 0, paths, embeddedWallet.address, deadline];

    const data = routerContract.interface.encodeFunctionData(
      'swapExactTokensForETHSupportingFeeOnTransferTokens',
      params
    );
    const unsignedTx = {
      to: routerAddress,
      chainId: Number(NETWORK_ID),
      data,
    };
    const receipt = await sendTransaction(unsignedTx);
    return { receipt, receiveAmount: ethAmount };
  };

  return {
    buyMachine,
    buyGoon,
    buySafeHouse,
    withdrawETH,
    withdrawToken,
    withdrawNFT,
    stakeNFT,
    retire,
    getNFTBalance,
    getETHBalance,
    getStakedNFTBalance,
    isMinted,
    swapEthToToken,
    swapTokenToEth,
    convertEthInputToToken,
    convertEthOutputToToken,
    convertTokenInputToEth,
    convertTokenOutputToEth,
  };
};

export default useSmartContract;
