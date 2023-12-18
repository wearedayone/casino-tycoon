import { Contract } from '@ethersproject/contracts';
import { usePrivy } from '@privy-io/react-auth';
import { parseEther, parseUnits, formatEther } from '@ethersproject/units';
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
import SwapRouterABI from '@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json';
import UniswapV3Factory from '@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json';
import QuoterABI from '@uniswap/v3-periphery/artifacts/contracts/interfaces/IQuoter.sol/IQuoter.json';

import useUserWallet from './useUserWallet';
import useSystemStore from '../stores/system.store';
import gameContractAbi from '../assets/abis/GameContract.json';
import tokenAbi from '../assets/abis/Token.json';
import nftAbi from '../assets/abis/NFT.json';
import { formatter } from '../utils/numbers';
import environments from '../utils/environments';

// test
import RAKKU from '../assets/abis/RAKKU.json';
import DAY1 from '../assets/abis/DAY1.json';

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
      throw err;
    }
  };

  const buyMachine = async (amount, value) => {
    console.log('Start buyMachine');
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

    const unsignedTx = {
      to: GAME_CONTRACT_ADDRESS,
      chainId: Number(NETWORK_ID),
      data,
    };

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

    let approveReceipt;
    const isApprovedAll = await nftContract.isApprovedForAll(embeddedWallet.address, GAME_CONTRACT_ADDRESS);
    if (!isApprovedAll) {
      const approveData = nftContract.interface.encodeFunctionData('setApprovalForAll', [GAME_CONTRACT_ADDRESS, true]);

      const approveUnsignedTx = {
        to: NFT_ADDRESS,
        chainId: Number(NETWORK_ID),
        data: approveData,
      };

      // console.log({ NFT_ADDRESS, GAME_CONTRACT_ADDRESS, approveData });
      approveReceipt = await sendTransaction(approveUnsignedTx);
    }

    if (approveReceipt?.status === 1) {
      await delay(1000);
    }

    if (!approveReceipt || approveReceipt?.status === 1) {
      const gameContract = new Contract(GAME_CONTRACT_ADDRESS, gameContractAbi.abi, privyProvider.provider);
      const data = gameContract.interface.encodeFunctionData('withdrawNFT', [address, 1, amount]);
      const unsignedTx = {
        to: GAME_CONTRACT_ADDRESS,
        chainId: Number(NETWORK_ID),
        data,
      };
      console.log('withdraw unsigned txn', unsignedTx);
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
    console.log('eth balance', Number(formatEther(res.toString())));
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

  // test swap
  const getPoolImmutables = async (poolContract) => {
    const [token0, token1, fee] = await Promise.all([poolContract.token0(), poolContract.token1(), poolContract.fee()]);

    const immutables = {
      token0: token0,
      token1: token1,
      fee: fee,
    };
    return immutables;
  };

  const getPoolState = async (poolContract) => {
    const slot = await poolContract.slot0();

    const state = {
      sqrtPriceX96: slot[0],
    };

    return state;
  };

  const getSwapContractInfo = async () => {
    const quoterAddress = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'; // put it in env
    const swapRouterAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564'; // put it in env
    const factoryAddress = '0x1F98431c8aD98523631AE4a59f267346ea31F984'; // put it in env
    const fee = 500;

    const privyProvider = await embeddedWallet.getEthereumProvider();

    const name0 = 'Polygon MATIC';
    const symbol0 = 'MATIC';
    const ethDecimals = 18;
    const ethAddress = '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889';

    // usdc
    // const address0 = '0x07865c6e87b9f70255377e024ace6630c1eaa37f';

    const name1 = 'Rakku Coin';
    const symbol1 = 'RAKKU';
    const tokenDecimals = 18;
    const tokenAddress = '0x8C2226F10D1abc6cFF3DD170f5b07101dd5D6E37';

    const factoryContract = new Contract(factoryAddress, UniswapV3Factory.abi, privyProvider.provider);
    const poolAddress = await factoryContract.getPool(ethAddress, tokenAddress, fee);

    const poolContract = new Contract(poolAddress, IUniswapV3PoolABI.abi, privyProvider.provider);
    const swapRouterContract = new Contract(swapRouterAddress, SwapRouterABI.abi, privyProvider.provider);
    const quoterContract = new Contract(quoterAddress, QuoterABI.abi, privyProvider.provider);

    return {
      quoterAddress,
      swapRouterAddress,
      factoryAddress,
      poolAddress,
      ethAddress,
      factoryContract,
      poolContract,
      swapRouterContract,
      quoterContract,
      ethDecimals,
      tokenAddress,
      tokenDecimals,
      fee,
    };
  };

  const convertEthInputToToken = async (ethAmount) => {
    if (!loadedAssets) return 0;
    const { fee, ethAddress, ethDecimals, tokenAddress, tokenDecimals, quoterContract } = await getSwapContractInfo();

    const amountIn = parseUnits(ethAmount.toString(), ethDecimals);
    const res = await quoterContract.callStatic.quoteExactInputSingle(ethAddress, tokenAddress, fee, amountIn, '0');
    return (Number(res.toString()) / Math.pow(10, tokenDecimals)).toLocaleString();
  };

  const convertEthOutputToToken = async (ethAmount) => {
    if (!loadedAssets) return 0;
    const { fee, ethAddress, ethDecimals, tokenAddress, tokenDecimals, quoterContract } = await getSwapContractInfo();

    const amountOut = parseUnits(ethAmount.toString(), ethDecimals);
    const res = await quoterContract.callStatic.quoteExactOutputSingle(tokenAddress, ethAddress, fee, amountOut, '0');
    return (Number(res.toString()) / Math.pow(10, tokenDecimals)).toLocaleString();
  };

  const convertTokenInputToEth = async (tokenAmount) => {
    if (!loadedAssets) return 0;
    const { fee, ethAddress, ethDecimals, tokenAddress, tokenDecimals, quoterContract } = await getSwapContractInfo();

    const amountIn = parseUnits(tokenAmount.toString(), tokenDecimals);
    const res = await quoterContract.callStatic.quoteExactInputSingle(tokenAddress, ethAddress, fee, amountIn, '0');
    return (Number(res.toString()) / Math.pow(10, ethDecimals)).toLocaleString();
  };

  const convertTokenOutputToEth = async (tokenAmount) => {
    if (!loadedAssets) return 0;
    const { fee, ethAddress, ethDecimals, tokenAddress, tokenDecimals, quoterContract } = await getSwapContractInfo();

    const amountOut = parseUnits(tokenAmount.toString(), tokenDecimals);
    const res = await quoterContract.callStatic.quoteExactOutputSingle(ethAddress, tokenAddress, fee, amountOut, '0');
    return (Number(res.toString()) / Math.pow(10, ethDecimals)).toLocaleString();
  };

  const swap = async () => {
    if (!loadedAssets) return false;
    const quoterAddress = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'; // put it in env
    const swapRouterAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564'; // put it in env
    const factoryAddress = '0x1F98431c8aD98523631AE4a59f267346ea31F984'; // put it in env

    // init price 10 DAY1 = 1 RAKKU

    const name0 = 'Polygon MATIC';
    const symbol0 = 'MATIC';
    const decimals0 = 18;
    const address0 = '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889';

    // usdc
    // const address0 = '0x07865c6e87b9f70255377e024ace6630c1eaa37f';

    const name1 = 'Rakku Coin';
    const symbol1 = 'RAKKU';
    const decimals1 = 18;
    const address1 = '0x8C2226F10D1abc6cFF3DD170f5b07101dd5D6E37';

    // euroc
    // const address1 = '0xa683d909e996052955500ddc45ca13e25c76e286';

    const privyProvider = await embeddedWallet.getEthereumProvider();

    const fee = 500;
    const factoryContract = new Contract(factoryAddress, UniswapV3Factory.abi, privyProvider.provider);
    console.log('factoryContract', factoryContract);
    const poolAddress = await factoryContract.getPool(address0, address1, fee);
    console.log({ address0, address1, fee, poolAddress });

    const poolContract = new Contract(poolAddress, IUniswapV3PoolABI.abi, privyProvider.provider);

    const immutables = await getPoolImmutables(poolContract);
    console.log({ immutables });
    const state = await getPoolState(poolContract);
    console.log({ state }, state.sqrtPriceX96.toString());

    const inputAmount = 0.01; // swap 0.01 matic for rakku
    const amountIn = parseUnits(inputAmount.toString(), decimals0);
    // const amountIn = 1;
    console.log({ amountIn });

    const quoterContract = new Contract(quoterAddress, QuoterABI.abi, privyProvider.provider);
    const res = await quoterContract.callStatic.quoteExactInputSingle(address0, address1, fee, amountIn, '0');
    console.log('amount in', Number(amountIn.toString()) / 1e18, 'amount out', Number(res.toString()) / 1e18);

    // const tokenContract = new Contract(address0, RAKKU.abi, privyProvider.provider);

    // const approveData = tokenContract.interface.encodeFunctionData('approve', [swapRouterAddress, amountIn.toString()]);
    // const approveUnsignedTx = {
    //   to: address0,
    //   chainId: Number(NETWORK_ID),
    //   data: approveData,
    // };
    // const signTxn = await sendTransaction(approveUnsignedTx);
    // console.log({signTxn})
    // await delay(1000);

    const swapRouterContract = new Contract(swapRouterAddress, SwapRouterABI.abi, privyProvider.provider);

    const params = {
      tokenIn: address0,
      tokenOut: address1,
      fee: fee,
      recipient: embeddedWallet.address,
      deadline: Math.floor(Date.now() / 1000) + 60 * 10,
      amountIn,
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0,
    };

    const swapData = swapRouterContract.interface.encodeFunctionData('exactInputSingle', [params]);
    const swapUnsignedData = {
      to: swapRouterAddress,
      chainId: Number(NETWORK_ID),
      data: swapData,
      // eslint-disable-next-line
      value: BigInt(inputAmount * Math.pow(10, decimals0)),
    };
    const txn = await sendTransaction(swapUnsignedData);
    console.log({ txn });
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
    swap,
    convertEthInputToToken,
    convertEthOutputToToken,
    convertTokenInputToEth,
    convertTokenOutputToEth,
  };
};

export default useSmartContract;
