import { Contract } from '@ethersproject/contracts';
import { usePrivy } from '@privy-io/react-auth';
import { parseEther, formatEther } from '@ethersproject/units';
import { defaultAbiCoder } from '@ethersproject/abi';
import RouterABI from '@uniswap/v2-periphery/build/IUniswapV2Router02.json';
import PairABI from '@uniswap/v2-core/build/IUniswapV2Pair.json';

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
  const market = useSystemStore((state) => state.market);

  const { tokenPrice } = market || { tokenPrice: 0 };

  const {
    tokenAddress: TOKEN_ADDRESS,
    gameAddress: GAME_CONTRACT_ADDRESS,
    nftAddress: NFT_ADDRESS,
    routerAddress: ROUTER_ADDRESS,
    wethAddress: WETH_ADDRESS,
    pairAddress: PAIR_ADDRESS,
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
        header: `Send ${value.toLocaleString()} $GANG to ${to}?`,
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

  const buyMachine = async ({ amount, value, time, nGangster, nonce, bType, referrerAddress, signature }) => {
    console.log('Start buyMachine');
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

    let params = [amount, value, time, nGangster, nonce, bType, referrerAddress, signature];
    const data = gameContract.interface.encodeFunctionData('buyGangster', params);
    const unsignedTx = {
      to: GAME_CONTRACT_ADDRESS,
      chainId: Number(NETWORK_ID),
      data,
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

  const buyGoon = async ({ amount, value, lastB, time, nonce, signature }) => {
    if (!loadedAssets) return;
    console.log({ amount, value, lastB, time, nonce });
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
    const bType = 1;
    let params = [bType, amount, valueBigint, lastB, time, nonce, signature];
    const data = gameContract.interface.encodeFunctionData('buyAsset', params);

    const unsignedTx = { to: GAME_CONTRACT_ADDRESS, chainId: Number(NETWORK_ID), data };

    const uiConfig = {
      header: `Buy ${amount} Goon${amount > 1 ? 's' : ''} with ${formatter.format(value)} GANG`,
      description: '',
      buttonText: 'Send transaction',
    };

    const receipt = await sendTransaction(unsignedTx, uiConfig);

    return receipt;
  };

  const buySafeHouse = async ({ type, amount, value, lastB, time, nonce, signature }) => {
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
    const bType = 2;
    let params = [bType, amount, valueBigint, lastB, time, nonce, signature];
    const data = gameContract.interface.encodeFunctionData('buyAsset', params);
    const unsignedTx = { to: GAME_CONTRACT_ADDRESS, chainId: Number(NETWORK_ID), data };

    const uiConfig = {
      header: `Upgrade Safehouse ${amount} time${amount > 1 ? 's' : ''} with ${formatter.format(value)} GANG`,
      description: '',
      buttonText: 'Send transaction',
    };

    const receipt = await sendTransaction(unsignedTx, uiConfig);

    return receipt;
  };

  const dailySpin = async ({ spinType, amount, value, lastSpin, time, nonce, signature }) => {
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
    const data = gameContract.interface.encodeFunctionData('spin', [
      spinType,
      amount,
      valueBigint,
      lastSpin,
      time,
      nonce,
      signature,
    ]);
    const unsignedTx = { to: GAME_CONTRACT_ADDRESS, chainId: Number(NETWORK_ID), data };

    const receipt = await sendTransaction(unsignedTx);
    console.log('daily spin', receipt);

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

  const retire = async ({ value, nonce, numberOfGangsters, signature }) => {
    console.log('Start retire', { value, nonce, numberOfGangsters, signature });
    if (!loadedAssets) return;
    const privyProvider = await embeddedWallet.getEthereumProvider();
    const gameContract = new Contract(GAME_CONTRACT_ADDRESS, gameContractAbi.abi, privyProvider.provider);

    // eslint-disable-next-line
    const valueBigInt = BigInt(parseEther(value + '').toString());
    // const params = [valueBigInt, numberOfGangsters, nonce, signature];
    const params = [nonce];
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
    if (!loadedAssets || !address) return 0;
    const privyProvider = await embeddedWallet.getEthereumProvider();
    const nftContract = new Contract(NFT_ADDRESS, nftAbi.abi, privyProvider.provider);

    const res = await nftContract.balanceOf(address, 1);
    return Number(res.toString());
  };

  const getETHBalance = async (address) => {
    if (!loadedAssets || !address) return 0;
    const privyProvider = await embeddedWallet.getEthereumProvider();
    const res = await privyProvider.provider.getBalance(address);
    return Number(formatEther(res.toString()));
  };

  const getStakedNFTBalance = async (address) => {
    if (!loadedAssets || !address) return 0;
    const privyProvider = await embeddedWallet.getEthereumProvider();
    const gameContract = new Contract(GAME_CONTRACT_ADDRESS, gameContractAbi.abi, privyProvider.provider);

    const res = await gameContract.gangster(address);
    return Number(res.toString());
  };

  const isMinted = async (address) => {
    if (!loadedAssets || !address) return false;
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
    const pairAddress = PAIR_ADDRESS;

    const routerContract = new Contract(routerAddress, RouterABI.abi, privyProvider.provider);
    const tokenContract = new Contract(tokenAddress, tokenAbi.abi, privyProvider.provider);
    const pairContract = new Contract(pairAddress, PairABI.abi, privyProvider.provider);

    const totalFees = await tokenContract.totalFees();
    const swapReceivePercent = (1000 - Number(totalFees.toString())) / 1000;

    return {
      routerAddress,
      tokenAddress,
      wethAddress,
      routerContract,
      tokenContract,
      pairContract,
      swapReceivePercent,
    };
  };

  const currentPoolState = async () => {
    const { pairContract } = await getSwapContractInfo();
    const reserves = await pairContract.getReserves();
    const [tokenInPool, wethInPool] = reserves;
    const k = tokenInPool * wethInPool;
    return { wethInPool, tokenInPool, k };
  };

  const convertEthInputToToken = async (ethAmount) => {
    if (!loadedAssets) return 0;
    const { tokenAddress, wethAddress, routerContract, swapReceivePercent } = await getSwapContractInfo();

    const amountIn = parseEther(`${ethAmount}`);
    console.log({ tokenAddress, wethAddress, routerContract, swapReceivePercent, amountIn, ROUTER_ADDRESS });
    const res = await routerContract.getAmountsOut(amountIn, [wethAddress, tokenAddress]);
    const amount = Number(formatEther(res[1]).toString()) * swapReceivePercent;
    console.log({ res, amount, routerContract });
    const tradingFee = Number(formatEther(res[1]).toString()) - amount;
    const tradingFeeInUSD = tradingFee * parseFloat(tokenPrice);

    return { amount, tradingFee: tradingFee.toFixed(2), tradingFeeInUSD: tradingFeeInUSD.toFixed(4) };
  };

  const convertEthOutputToToken = async (ethAmount) => {
    if (!loadedAssets) return 0;
    const { tokenAddress, wethAddress, routerContract, swapReceivePercent } = await getSwapContractInfo();
    const { wethInPool } = await currentPoolState();
    if (ethAmount >= Number(formatEther(wethInPool).toString()))
      throw new Error(
        `Not enough ETH in pool, ETH left: ${formatter.format(Number(formatEther(wethInPool).toString()))}`
      );

    const amountOut = parseEther(`${ethAmount}`);
    const res = await routerContract.getAmountsIn(amountOut, [tokenAddress, wethAddress]);
    const amount = Number(formatEther(res[0]).toString()) / swapReceivePercent;

    const tradingFee = amount - Number(formatEther(res[0]).toString());
    const tradingFeeInUSD = tradingFee * parseFloat(tokenPrice);

    return { amount, tradingFee: tradingFee.toFixed(2), tradingFeeInUSD: tradingFeeInUSD.toFixed(4) };
  };

  const convertTokenInputToEth = async (tokenAmount) => {
    if (!loadedAssets) return 0;
    const { tokenAddress, wethAddress, routerContract, swapReceivePercent } = await getSwapContractInfo();

    const tokenAmountFeesIncluded = tokenAmount * swapReceivePercent;
    const amountIn = parseEther(`${tokenAmountFeesIncluded}`);
    const res = await routerContract.getAmountsOut(amountIn, [tokenAddress, wethAddress]);
    const amount = formatEther(res[1]);

    const tradingFee = tokenAmountFeesIncluded - tokenAmount;
    const tradingFeeInUSD = tradingFee * parseFloat(tokenPrice);

    return { amount, tradingFee: tradingFee.toFixed(2), tradingFeeInUSD: tradingFeeInUSD.toFixed(4) };
  };

  const convertTokenOutputToEth = async (tokenAmount) => {
    if (!loadedAssets) return 0;
    const { tokenAddress, wethAddress, routerContract, swapReceivePercent } = await getSwapContractInfo();

    const { tokenInPool } = await currentPoolState();
    const tokenAmountFeesIncluded = tokenAmount / swapReceivePercent;
    if (tokenAmountFeesIncluded >= Number(formatEther(tokenInPool).toString()))
      throw new Error(
        `Not enough $GANG in pool, $GANG left: ${formatter.format(Number(formatEther(tokenInPool).toString()))}`
      );

    const amountOut = parseEther(`${tokenAmountFeesIncluded}`);
    const res = await routerContract.getAmountsIn(amountOut, [wethAddress, tokenAddress]);
    const amount = formatEther(res[0]);

    const tradingFee = tokenAmountFeesIncluded - tokenAmount;
    const tradingFeeInUSD = tradingFee * parseFloat(tokenPrice);

    return { amount, tradingFee: tradingFee.toFixed(2), tradingFeeInUSD: tradingFeeInUSD.toFixed(4) };
  };

  const swapEthToToken = async (amount) => {
    if (!loadedAssets) return false;
    const { tokenAddress, wethAddress, routerAddress, routerContract } = await getSwapContractInfo();

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
    const logs = receipt.logs;
    const tokenTransferLog = logs.find(
      (log) =>
        log.topics.length === 3 && defaultAbiCoder.decode(['address'], log.topics[2]).includes(embeddedWallet.address)
    );
    const receiveAmountHex = tokenTransferLog.data;
    const receiveAmountDec = parseInt(
      formatEther(parseInt(receiveAmountHex).toLocaleString('fullwide', { useGrouping: false }))
    );

    return { receipt, receiveAmount: receiveAmountDec };
  };

  const swapTokenToEth = async (amount) => {
    if (!loadedAssets) return false;

    const { tokenAddress, wethAddress, routerAddress, routerContract, tokenContract } = await getSwapContractInfo();

    const amountIn = parseEther(`${amount}`);

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
    const logs = receipt.logs;
    const ethWithdrawLog = logs[logs.length - 1];
    const receiveAmountHex = ethWithdrawLog.data;
    const receiveAmountDec = formatEther(parseInt(receiveAmountHex).toString());

    return { receipt, receiveAmount: receiveAmountDec };
  };

  const getTotalFees = async () => {
    if (!loadedAssets) return;

    try {
      const privyProvider = await embeddedWallet.getEthereumProvider();
      const tokenContract = new Contract(TOKEN_ADDRESS, tokenAbi.abi, privyProvider.provider);

      const totalFees = await tokenContract.totalFees();
      return Number(totalFees.toString()) / 100;
    } catch (err) {
      return 0;
    }
  };

  return {
    buyMachine,
    buyGoon,
    buySafeHouse,
    dailySpin,
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
    getTotalFees,
  };
};

export default useSmartContract;
