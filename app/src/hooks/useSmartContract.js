import { Contract } from '@ethersproject/contracts';
import { usePrivy } from '@privy-io/react-auth';
import { parseEther, formatEther } from '@ethersproject/units';
import { Interface, defaultAbiCoder } from '@ethersproject/abi';
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

const tokenInterface = new Interface(tokenAbi.abi);
const gameInterface = new Interface(gameContractAbi.abi);

const useSmartContract = () => {
  const { sendTransaction: privySendTransaction } = usePrivy();
  const { userWallet, getProvider } = useUserWallet();
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

  const loadedAssets = !!TOKEN_ADDRESS && !!GAME_CONTRACT_ADDRESS && !!NFT_ADDRESS && !!userWallet;

  const sendTransaction = async ({ txnRequest, privyUiConfig = {} }) => {
    if (userWallet.walletClientType === 'privy') {
      const receipt = await privySendTransaction({ ...txnRequest, chainId: Number(NETWORK_ID) }, privyUiConfig);
      return receipt;
    } else {
      const { provider } = await getProvider();
      const transactionHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{ ...txnRequest, chainId: Number(NETWORK_ID), from: userWallet.address }],
      });

      let receipt = {};
      try {
        receipt = await provider.request({
          method: 'eth_getTransactionReceipt',
          params: [transactionHash],
        });
      } catch (error) {}

      return { ...receipt, transactionHash, status: Number(receipt?.status || 1) };
    }
  };
  const withdrawToken = async (to, value) => {
    if (!loadedAssets) return;
    try {
      // eslint-disable-next-line no-undef
      const valueInWei = BigInt(parseEther(value.toString()).toString());
      const data = tokenInterface.encodeFunctionData('transfer', [to, valueInWei]);

      const txnRequest = { to: TOKEN_ADDRESS, data };

      const privyUiConfig = {
        header: `Send ${value.toLocaleString()} $GREED to ${to}?`,
        description: '',
        buttonText: 'Transfer',
      };

      const receipt = await sendTransaction({ txnRequest, privyUiConfig });

      return receipt;
    } catch (err) {
      console.error(err.message);
      throw err;
    }
  };

  const withdrawETH = async (to, value) => {
    if (!loadedAssets) return;
    try {
      const txnRequest = {
        to,
        // eslint-disable-next-line
        value: BigInt(parseEther(value.toString()).toString()),
      };

      const privyUiConfig = {
        header: `Send ${formatter.format(value)} ETH to ${to}?`,
        description: '',
        buttonText: 'Transfer',
      };
      const txReceipt = await sendTransaction({ txnRequest, privyUiConfig });
      return txReceipt;
    } catch (err) {
      console.error(err.message);
      throw err;
    }
  };

  const buyMachine = async ({ amount, value, time, nGangster, nonce, bType, signature }) => {
    console.log('Start buyMachine');
    if (!loadedAssets) return;
    const provider = await getProvider();
    const tokenContract = new Contract(TOKEN_ADDRESS, tokenAbi.abi, provider);

    const res = await tokenContract.allowance(userWallet.address, GAME_CONTRACT_ADDRESS);
    const approvedAmountInWei = res.toString();
    const approvedAmountInToken = Number(approvedAmountInWei.slice(0, approvedAmountInWei.length - 18));
    const needApprovedMore = approvedAmountInToken < value;

    if (needApprovedMore) {
      // eslint-disable-next-line no-undef
      const approveValueBigint = BigInt(parseEther(1e9 + '').toString());
      const data = tokenContract.interface.encodeFunctionData('approve', [GAME_CONTRACT_ADDRESS, approveValueBigint]);
      const txnRequest = { to: TOKEN_ADDRESS, data };
      await sendTransaction({ txnRequest });
      await delay(1000);
    }
    // eslint-disable-next-line no-undef
    const valueBigint = BigInt(parseEther(value + '').toString());
    let params = [amount, valueBigint, time, nGangster, nonce, bType, signature];
    const data = gameInterface.encodeFunctionData('buyGangster', params);
    const txnRequest = { to: GAME_CONTRACT_ADDRESS, data };

    const privyUiConfig = {
      header: `Buy ${amount} gangster${amount > 1 ? 's' : ''} with ${formatter.format(value)} GREED`,
      description: '',
      buttonText: 'Send transaction',
    };
    console.log('Start sendTransaction');
    const receipt = await sendTransaction({ txnRequest, privyUiConfig });

    console.log('Finish buyMachine', receipt);
    return receipt;
  };

  const buyGoon = async ({ amount, value, lastB, time, nonce, signature }) => {
    if (!loadedAssets) return;
    // console.log({ amount, value, lastB, time, nonce });
    const provider = await getProvider();
    const tokenContract = new Contract(TOKEN_ADDRESS, tokenAbi.abi, provider);

    const res = await tokenContract.allowance(userWallet.address, GAME_CONTRACT_ADDRESS);
    const approvedAmountInWei = res.toString();
    const approvedAmountInToken = Number(approvedAmountInWei.slice(0, approvedAmountInWei.length - 18));
    const needApprovedMore = approvedAmountInToken < value;

    if (needApprovedMore) {
      // eslint-disable-next-line no-undef
      const approveValueBigint = BigInt(parseEther(1e9 + '').toString());
      const data = tokenContract.interface.encodeFunctionData('approve', [GAME_CONTRACT_ADDRESS, approveValueBigint]);
      const txnRequest = { to: TOKEN_ADDRESS, data };
      await sendTransaction({ txnRequest });
      await delay(1000);
    }

    // eslint-disable-next-line no-undef
    const valueBigint = BigInt(parseEther(value + '').toString());
    const bType = 1;
    let params = [bType, amount, valueBigint, lastB, time, nonce, signature];
    const data = gameInterface.encodeFunctionData('buyAsset', params);

    const txnRequest = { to: GAME_CONTRACT_ADDRESS, data };

    const privyUiConfig = {
      header: `Buy ${amount} Goon${amount > 1 ? 's' : ''} with ${formatter.format(value)} GREED`,
      description: '',
      buttonText: 'Send transaction',
    };

    const receipt = await sendTransaction({ txnRequest, privyUiConfig });

    return receipt;
  };

  const buySafeHouse = async ({ amount, value, lastB, time, nonce, signature }) => {
    if (!loadedAssets) return;
    const provider = await getProvider();
    const tokenContract = new Contract(TOKEN_ADDRESS, tokenAbi.abi, provider);

    const res = await tokenContract.allowance(userWallet.address, GAME_CONTRACT_ADDRESS);
    const approvedAmountInWei = res.toString();
    const approvedAmountInToken = Number(approvedAmountInWei.slice(0, approvedAmountInWei.length - 18));
    const needApprovedMore = approvedAmountInToken < value;

    if (needApprovedMore) {
      // eslint-disable-next-line no-undef
      const approveValueBigint = BigInt(parseEther(1e9 + '').toString());
      const data = tokenContract.interface.encodeFunctionData('approve', [GAME_CONTRACT_ADDRESS, approveValueBigint]);
      const txnRequest = { to: TOKEN_ADDRESS, data };
      await sendTransaction({ txnRequest });
      await delay(1000);
    }

    // eslint-disable-next-line no-undef
    const valueBigint = BigInt(parseEther(value + '').toString());
    const bType = 2;
    let params = [bType, amount, valueBigint, lastB, time, nonce, signature];
    const data = gameInterface.encodeFunctionData('buyAsset', params);
    const txnRequest = { to: GAME_CONTRACT_ADDRESS, data };

    const privyUiConfig = {
      header: `Upgrade Safehouse ${amount} time${amount > 1 ? 's' : ''} with ${formatter.format(value)} GREED`,
      description: '',
      buttonText: 'Send transaction',
    };

    const receipt = await sendTransaction({ txnRequest, privyUiConfig });

    return receipt;
  };

  const dailySpin = async ({ spinType, amount, value, lastSpin, time, nonce, signature }) => {
    if (!loadedAssets) return;
    const provider = await getProvider();
    const tokenContract = new Contract(TOKEN_ADDRESS, tokenAbi.abi, provider);

    const res = await tokenContract.allowance(userWallet.address, GAME_CONTRACT_ADDRESS);
    const approvedAmountInWei = res.toString();
    const approvedAmountInToken = Number(approvedAmountInWei.slice(0, approvedAmountInWei.length - 18));
    const needApprovedMore = approvedAmountInToken < value;

    if (needApprovedMore) {
      // eslint-disable-next-line no-undef
      const approveValueBigint = BigInt(parseEther(1e9 + '').toString());
      const data = tokenContract.interface.encodeFunctionData('approve', [GAME_CONTRACT_ADDRESS, approveValueBigint]);
      const txnRequest = { to: TOKEN_ADDRESS, data };
      await sendTransaction({ txnRequest });
      await delay(1000);
    }

    // eslint-disable-next-line no-undef
    const valueBigint = BigInt(parseEther(value + '').toString());
    const data = gameInterface.encodeFunctionData('spin', [
      spinType,
      amount,
      valueBigint,
      lastSpin,
      time,
      nonce,
      signature,
    ]);
    const txnRequest = { to: GAME_CONTRACT_ADDRESS, data };

    const receipt = await sendTransaction({ txnRequest });

    return receipt;
  };

  const withdrawNFT = async (address, amount) => {
    if (!loadedAssets) return;
    const data = gameInterface.encodeFunctionData('withdrawNFT', [address, amount]);
    const txnRequest = { to: GAME_CONTRACT_ADDRESS, data };
    const receipt = await sendTransaction({ txnRequest });
    return receipt;
  };

  const stakeNFT = async (address, amount) => {
    if (!loadedAssets) return;
    const provider = await getProvider();
    const nftContract = new Contract(NFT_ADDRESS, nftAbi.abi, provider);

    const isApprovedForAll = await nftContract.isApprovedForAll(userWallet.address, GAME_CONTRACT_ADDRESS);

    let approveReceipt;
    if (!isApprovedForAll) {
      const approveData = nftContract.interface.encodeFunctionData('setApprovalForAll', [GAME_CONTRACT_ADDRESS, true]);

      const approveUnsignedTx = { to: NFT_ADDRESS, data: approveData };
      approveReceipt = await sendTransaction({ txnRequest: approveUnsignedTx });
      await delay(1000);
    }

    if (!approveReceipt || approveReceipt.status === 1) {
      const data = gameInterface.encodeFunctionData('depositNFT', [address, amount]);
      const txnRequest = { to: GAME_CONTRACT_ADDRESS, data };
      const receipt = await sendTransaction({ txnRequest });
      return receipt;
    }
  };

  const retire = async ({ value, nonce, numberOfGangsters, signature }) => {
    // console.log('Start retire', { value, nonce, numberOfGangsters, signature });
    if (!loadedAssets) return;
    // eslint-disable-next-line
    const valueBigInt = BigInt(parseEther(value + '').toString());
    // const params = [valueBigInt, numberOfGangsters, nonce, signature];
    const params = [nonce];
    const data = gameInterface.encodeFunctionData('retired', params);

    const txnRequest = { to: GAME_CONTRACT_ADDRESS, data };

    const privyUiConfig = {
      header: `Retire now to receive ${formatter.format(value)} ETH`,
      description: '',
      buttonText: 'Send transaction',
    };
    console.log('Start sendTransaction');
    const receipt = await sendTransaction({ txnRequest, privyUiConfig });
    console.log('Finish retire', receipt);
    return receipt;
  };

  const getNFTBalance = async (address) => {
    if (!loadedAssets || !address) return 0;
    const provider = await getProvider();
    const nftContract = new Contract(NFT_ADDRESS, nftAbi.abi, provider);

    const res = await nftContract.balanceOf(address, 1);
    return Number(res.toString());
  };

  const getETHBalance = async (address) => {
    if (!loadedAssets || !address) return 0;
    const provider = await getProvider();
    const res =
      userWallet.walletClientType === 'privy'
        ? await provider.getBalance(address)
        : await provider.provider.request({
            method: 'eth_getBalance',
            params: [address],
          });
    console.log({ res });
    return Number(formatEther(res.toString()));
  };

  const getStakedNFTBalance = async (address) => {
    if (!loadedAssets || !address) return 0;
    const provider = await getProvider();
    const gameContract = new Contract(GAME_CONTRACT_ADDRESS, gameContractAbi.abi, provider);

    const res = await gameContract.gangster(address);
    return Number(res.toString());
  };

  const isMinted = async (address) => {
    if (!loadedAssets || !address) return false;
    const provider = await getProvider();
    const nftContract = new Contract(NFT_ADDRESS, nftAbi.abi, provider);
    const minted = await nftContract.mintedAddess(address);
    return minted;
  };

  const getSwapContractInfo = async () => {
    const provider = await getProvider();

    const tokenAddress = TOKEN_ADDRESS;
    const routerAddress = ROUTER_ADDRESS;
    const wethAddress = WETH_ADDRESS;
    const pairAddress = PAIR_ADDRESS;

    const routerContract = new Contract(routerAddress, RouterABI.abi, provider);
    const tokenContract = new Contract(tokenAddress, tokenAbi.abi, provider);
    const pairContract = new Contract(pairAddress, PairABI.abi, provider);

    const totalFees = await tokenContract.totalFees();
    const swapReceivePercent = (10000 - Number(totalFees.toString())) / 10000;

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
    const res = await routerContract.getAmountsOut(amountIn, [wethAddress, tokenAddress]);
    const amount = Number(formatEther(res[1]).toString()) * swapReceivePercent;
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
        `Not enough $GREED in pool, $GREED left: ${formatter.format(Number(formatEther(tokenInPool).toString()))}`
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
    const params = [0, paths, userWallet.address, deadline];

    const data = routerContract.interface.encodeFunctionData(
      'swapExactETHForTokensSupportingFeeOnTransferTokens',
      params
    );
    const txnRequest = {
      to: routerAddress,
      data,
      // eslint-disable-next-line
      value: BigInt(parseEther(`${amount}`).toString()),
    };
    const receipt = await sendTransaction({ txnRequest });
    const logs = receipt.logs;
    const tokenTransferLog = logs.find(
      (log) =>
        log.topics.length === 3 && defaultAbiCoder.decode(['address'], log.topics[2]).includes(userWallet.address)
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

    const res = await tokenContract.allowance(userWallet.address, routerAddress);
    const approvedAmountInWei = res.toString();
    const approvedAmountInToken = Number(approvedAmountInWei.slice(0, approvedAmountInWei.length - 18));
    const needApprovedMore = approvedAmountInToken < amount;

    if (needApprovedMore) {
      // eslint-disable-next-line no-undef
      const approveValueBigint = BigInt(parseEther(1e9 + '').toString());
      const data = tokenContract.interface.encodeFunctionData('approve', [routerAddress, approveValueBigint]);
      const txnRequest = { to: tokenAddress, data };
      await sendTransaction({ txnRequest });
      await delay(1000);
    }

    const paths = [tokenAddress, wethAddress];
    const deadline = Math.floor(Date.now() / 1000 + 10 * 60);
    const params = [amountIn, 0, paths, userWallet.address, deadline];

    const data = routerContract.interface.encodeFunctionData(
      'swapExactTokensForETHSupportingFeeOnTransferTokens',
      params
    );
    const txnRequest = { to: routerAddress, data };
    const receipt = await sendTransaction({ txnRequest });
    const logs = receipt.logs;
    const ethWithdrawLog = logs[logs.length - 1];
    const receiveAmountHex = ethWithdrawLog.data;
    const receiveAmountDec = formatEther(parseInt(receiveAmountHex).toString());

    return { receipt, receiveAmount: receiveAmountDec };
  };

  const getTotalFees = async () => {
    if (!loadedAssets) return;

    try {
      const provider = await getProvider();
      const tokenContract = new Contract(TOKEN_ADDRESS, tokenAbi.abi, provider);

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
