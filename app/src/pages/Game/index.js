import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import Phaser from 'phaser';
import CircleMaskImagePlugin from 'phaser3-rex-plugins/plugins/circlemaskimage-plugin.js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { usePrivy } from '@privy-io/react-auth';
import * as Sentry from '@sentry/react';

import useUserStore from '../../stores/user.store';
import useSystemStore from '../../stores/system.store';
import useSettingStore from '../../stores/setting.store';
import useSpinStore from '../../stores/spin.store';
import {
  applyInviteCode,
  getRank,
  getWarHistory,
  getWarHistoryDetail,
  updateBalance,
  checkUserCode,
} from '../../services/user.service';
import {
  create,
  validate,
  claimToken,
  getWorkerPrices,
  getBuildingPrices,
  validateDailySpin,
  buyAssetsWithXToken,
} from '../../services/transaction.service';
import {
  getLeaderboard,
  getNextWarSnapshotUnixTime,
  updateLastTimeSeenGangWarResult,
  updateUserWarAttack,
  updateUserWarMachines,
} from '../../services/gamePlay.service';
import {
  getLatestWar,
  getUserListToAttack,
  getUserDetailToAttack,
  getLatestWarResult,
} from '../../services/war.service';
import QueryKeys from '../../utils/queryKeys';
import { calculateHouseLevel, calculateSpinPrice } from '../../utils/formulas';
import useSmartContract from '../../hooks/useSmartContract';

import gameConfigs from './configs/configs';
import LoadingScene from './scenes/LoadingScene';
import MainScene from './scenes/MainScene';
import TutorialScene from './scenes/TutorialScene';
import useUserWallet from '../../hooks/useUserWallet';
import useSeasonCountdown from '../../hooks/useSeasonCountdown';
import useSimulatorGameListener from '../../hooks/useSimulatorGameListener';
import useSalesLast24h from '../../hooks/useSalesLast24h';
import { logAnalyticsEvent } from '../../configs/firebase.config';
import { useShallow } from 'zustand/react/shallow';

const { width, height } = gameConfigs;
const MILISECONDS_IN_A_DAY = 86400 * 1000;

const lineBreakMessage = (message) => {
  const MAX_WORD_LENGTH = 20;
  if (message.length <= MAX_WORD_LENGTH) return message;

  const words = message.trim().split(' ');
  const brokenWords = [words[0]];
  for (let i = 1; i < words.length; i++) {
    const newWord = words[i];
    const lastWord = brokenWords.at(-1);
    if (lastWord.length + newWord.length + 1 <= MAX_WORD_LENGTH) {
      brokenWords[brokenWords.length - 1] = brokenWords.at(-1) + ` ${newWord}`;
    } else {
      brokenWords.push(newWord);
    }
  }

  return brokenWords.join('\n');
};

const handleError = (err) => {
  if (err.message === 'The user rejected the request') {
    return { code: '4001', message: 'The user rejected\nthe request' };
  } else {
    console.error(err);

    const message = err.message;
    const code = err.code?.toString();

    console.log({ message, code, reason: err?.reason, error: err?.error?.reason });

    if (message === 'Network Error') {
      return { code: '12002', message: 'Network Error' };
    }

    if (message.includes('replacement fee too low')) return { code: '4001', message: 'Replacement fee\ntoo low' };

    if (message.includes('Transaction reverted without a reason string'))
      return { code: '4001', message: 'Transaction reverted' };

    if (message.includes('Request failed with status code 422')) return { code: '4001', message: 'Request failed' };

    if (message.includes('invalid address or ENS name')) return { code: '4001', message: 'Invalid address\nor ENS' };

    if (message.includes('User exited before wallet could be connected'))
      return { code: '4001', message: 'User exited' };

    if (message.includes('transaction failed')) return { code: '4001', message: 'Transaction failed' };

    if (message.includes('missing response')) return { code: '4001', message: 'Missing response' };

    if (message.includes('Cannot redefine property: ethereum'))
      return { code: '4001', message: 'Cannot redefine\nethereum' };

    if (message.includes('insufficient funds for intrinsic transaction cost'))
      return { code: 'INSUFFICIENT_FUNDS', message: 'Insufficient ETH' };

    if (code === 'UNPREDICTABLE_GAS_LIMIT' || code === '-32603') {
      if (err?.error?.reason && err.error?.reason.includes('execution reverted:')) {
        const error = err.error?.reason.replace('execution reverted: ', '');
        return { code: 'UNPREDICTABLE_GAS_LIMIT', message: error ? lineBreakMessage(error) : 'INSUFFICIENT GAS' };
      }

      return { code: 'UNPREDICTABLE_GAS_LIMIT', message: 'INSUFFICIENT GAS' };
    }

    if (code === 'INSUFFICIENT_FUNDS') return { code: 'INSUFFICIENT_FUNDS', message: 'INSUFFICIENT ETH' };

    if (code === 'INVALID_ARGUMENT') return { code: 'INVALID_ARGUMENT', message: 'INVALID ARGUMENT' };

    if (code === 'NETWORK_ERROR') return { code: 'NETWORK_ERROR', message: 'Network Error' };

    Sentry.captureException(err);
    return { code: '4001', message: 'Unknown Error' };
  }
};

const Game = () => {
  const { enqueueSnackbar } = useSnackbar();
  const embeddedWallet = useUserWallet();
  const queryClient = useQueryClient();
  const [userHasInteractive, setUserHasInteracted] = useState(false);
  const gameRef = useRef();
  const gameLoaded = useRef();
  const gameEventListened = useRef();
  const [loaded, setLoaded] = useState(false);
  const profile = useUserStore((state) => state.profile);
  const gamePlay = useUserStore((state) => state.gamePlay);
  const reloadWarDeployment = useUserStore((state) => state.reloadWarDeployment);
  const activeSeason = useSystemStore((state) => state.activeSeason);
  const activeSeasonId = useSystemStore(useShallow((state) => state.activeSeason?.id));
  const activeSeasonEstimatedEndTime = useSystemStore(
    useShallow((state) => state.activeSeason?.estimatedEndTime.seconds)
  );
  const warConfig = useSystemStore(
    useShallow((state) => state.activeSeason?.warConfig),
    (a, b) => JSON.stringify(a) === JSON.stringify(b)
  );
  const configs = useSystemStore((state) => state.configs);
  const market = useSystemStore((state) => state.market);
  const templates = useSystemStore((state) => state.templates);
  const estimatedGas = useSystemStore((state) => state.estimatedGas);
  const sound = useSettingStore((state) => state.sound);
  const toggleSound = useSettingStore((state) => state.toggleSound);
  const setOnlineListener = useSettingStore((state) => state.setOnlineListener);
  const {
    getNFTBalance,
    getETHBalance,
    withdrawToken,
    withdrawETH,
    withdrawNFT,
    stakeNFT,
    buySafeHouse,
    buyMachine,
    buyGoon,
    dailySpin,
    retire,
    swapEthToToken,
    swapTokenToEth,
    convertEthInputToToken,
    convertEthOutputToToken,
    convertTokenInputToEth,
    convertTokenOutputToEth,
    getTotalFees,
  } = useSmartContract();
  const { ready, authenticated, user, exportWallet: exportWalletPrivy, logout } = usePrivy();
  const [isLeaderboardModalOpen, setLeaderboardModalOpen] = useState(false);
  const [userCanReload, setUserCanReload] = useState(false);
  const [mouseDown, setMouseDown] = useState(false);
  const [startLoadingTime, setStartLoadingTime] = useState(Date.now());
  const { isEnded, countdownString } = useSeasonCountdown({ open: isLeaderboardModalOpen });
  const [showBg, setShowBg] = useState(true);
  const {
    workerSoldLast24h,
    buildingSoldLast24h,
    enableWorkerSalesTracking,
    disableWorkerSalesTracking,
    enableBuildingSalesTracking,
    disableBuildingSalesTracking,
  } = useSalesLast24h();

  const spinInitialized = useSpinStore((state) => state.initialized);
  const spinned = useSpinStore((state) => state.spinned);

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const reloadUserWarDeployment = async () => {
    try {
      await reloadWarDeployment();
    } catch (err) {
      console.error(err);
      Sentry.captureException(err);
    }
  };

  // useEffect(() => {
  //   if (!!embeddedWallet) {
  //     console.log('swap', embeddedWallet);
  //     swapTokenToEth(10)
  //       .then(console.log)
  //       .catch((err) => console.log('error swap', err));
  //   }
  // }, [embeddedWallet]);

  const { appVersion, appReloadThresholdInSeconds } = configs || {};
  const { ethPriceInUsd, tokenPrice, nftPrice } = market || {};

  // Check that your user is authenticated
  const isAuthenticated = useMemo(() => ready && authenticated, [ready, authenticated]);

  // Check that your user has an embedded wallet
  const hasEmbeddedWallet = useMemo(
    () => !!user.linkedAccounts.find((account) => account.type === 'wallet' && account.walletClientType === 'privy'),
    [user]
  );

  const { status, data: rankData } = useQuery({
    queryFn: getRank,
    queryKey: [QueryKeys.Rank, profile?.id],
    enabled: !!profile?.id,
    refetchInterval: 30 * 1000,
    retry: 3,
    onError: (err) => {
      Sentry.captureException(err);
    },
  });
  const { data: leaderboardData } = useQuery({
    queryKey: [QueryKeys.Leaderboard],
    queryFn: getLeaderboard,
    // refetchInterval: 30 * 1000,
    retry: 3,
    onError: (err) => {
      Sentry.captureException(err);
    },
  });

  const {
    username,
    address,
    avatarURL,
    avatarURL_big,
    xTokenBalance,
    tokenBalance,
    ETHBalance,
    inviteCode,
    referralCode,
    referralTotalReward = 0,
    referralTotalDiscount = 0,
  } = profile || {
    xTokenBalance: 0,
    tokenBalance: 0,
    ETHBalance: 0,
  };

  const { setupSimulatorGameListener } = useSimulatorGameListener();
  const {
    numberOfMachines,
    numberOfWorkers,
    numberOfBuildings,
    networth,
    isWhitelisted,
    whitelistAmountMinted,
    warDeployment,
  } = gamePlay || {
    numberOfMachines: 0,
    numberOfWorkers: 0,
    numberOfBuildings: 0,
    networth: 0,
    whitelistAmountMinted: 0,
    warDeployment: {
      numberOfMachinesToEarn: 0,
      numberOfMachinesToAttack: 0,
      numberOfMachinesToDefend: 0,
      attackUserId: null,
      acttackUser: null,
    },
  };
  const {
    machine,
    worker,
    building,
    workerSold,
    buildingSold,
    reservePool,
    reservePoolReward,
    houseLevels,
    prizePoolConfig,
    spinConfig: { spinRewards },
  } = activeSeason || {
    rankPrizePool: 0,
    reputationPrizePool: 0,
    machine: { dailyReward: 0, basePrice: 0, whitelistPrice: 0, networth: 0 },
    worker: { basePrice: 0, targetDailyPurchase: 1, targetPrice: 0, dailyReward: 0, networth: 0 },
    building: { basePrice: 0, targetDailyPurchase: 1, targetPrice: 0, dailyReward: 0, networth: 0 },
    buildingSold: 0,
    workerSold: 0,
    machineSold: 0,
    reservePool: 0,
    reservePoolReward: 0,
    houseLevels: [],
    prizePoolConfig: {
      // rank leaderboard
      rankRewardsPercent: 0,
      lowerRanksCutoffPercent: 0,
      // reputation leaderboard
      earlyRetirementTax: 0,
    },
    spinConfig: { spinRewards: [] },
  };

  const dailyToken = numberOfMachines * machine.dailyReward;
  const dailyXToken = numberOfWorkers * worker.dailyReward;

  useEffect(() => {
    setStartLoadingTime(Date.now());
  }, []);

  useEffect(() => {
    if (!appReloadThresholdInSeconds || userCanReload) return;
    const elapsedTime = Date.now() - startLoadingTime;
    const remainingTime = appReloadThresholdInSeconds * 1000 - elapsedTime;

    if (remainingTime <= 0) {
      setUserCanReload(true);
    } else {
      const timer = setTimeout(() => {
        setUserCanReload(true);
      }, remainingTime);

      return () => clearTimeout(timer);
    }
  }, [userCanReload, startLoadingTime, appReloadThresholdInSeconds]);

  const exportWallet = async () => {
    if (!isAuthenticated || !hasEmbeddedWallet) return;
    try {
      await exportWalletPrivy();
    } catch (err) {
      console.error(err);
      Sentry.captureException(err);
    }
  };
  const reloadBalance = async () => {
    try {
      console.log('refreshing eth balance');
      await updateBalance();
    } catch (err) {
      console.error(err);
      Sentry.captureException(err);
    } finally {
      gameRef.current?.events.emit('refresh-eth-balance-completed');
    }
  };

  const transfer = async ({ amount, address, tokenType }) => {
    let web3Withdraw, txnStartedEvent, txnCompletedEvent;
    switch (tokenType) {
      case 'FIAT':
        web3Withdraw = withdrawToken;
        txnStartedEvent = 'withdraw-token-started';
        txnCompletedEvent = 'withdraw-token-completed';
        break;
      case 'ETH':
        web3Withdraw = withdrawETH;
        txnStartedEvent = 'withdraw-eth-started';
        txnCompletedEvent = 'withdraw-eth-completed';
        break;
      case 'NFT':
        web3Withdraw = withdrawNFT;
        txnStartedEvent = 'withdraw-nft-started';
        txnCompletedEvent = 'withdraw-nft-completed';
        break;
    }
    try {
      if (!web3Withdraw) throw new Error(`Invalid tokenType. Must be one of 'ETH' | 'FIAT' | 'NFT'`);
      gameRef.current?.events.emit(txnStartedEvent);

      const value = Number(amount);
      let txnId;
      if (tokenType === 'ETH') {
        const res = await create({ type: 'withdraw', token: tokenType, value, to: address });
        txnId = res.data.id;
      }
      const receipt = await web3Withdraw(address, value);
      if (receipt) {
        console.log({ receipt });
        gameRef.current?.events.emit(txnCompletedEvent, { amount, txnHash: receipt.transactionHash });
        if (receipt.status === 1) {
          if (txnId && ['ETH', 'FIAT'].includes(tokenType))
            await validate({ transactionId: txnId, txnHash: receipt.transactionHash });
        }
      }
    } catch (err) {
      const { message, code } = handleError(err);
      gameRef.current?.events.emit(txnCompletedEvent, {
        status: 'failed',
        code,
        message,
        amount,
        txnHash: '',
      });
    }
  };

  const stake = async (amount) => {
    try {
      gameRef.current?.events.emit('deposit-nft-started');

      const receipt = await stakeNFT(address, amount);
      if (receipt.status === 1) {
        gameRef.current?.events.emit('deposit-nft-completed', { amount, txnHash: receipt.transactionHash });
      }
    } catch (err) {
      err.message && enqueueSnackbar(err.message, { variant: 'error' });
      console.error(err);
      Sentry.captureException(err);
    }
  };

  const buyBuilding = async ({ quantity, token }) => {
    try {
      if (token === 'xGANG') {
        await buyAssetsWithXToken({ type: 'building', amount: quantity });
      } else {
        const res = await create({ type: 'buy-building', amount: quantity, token });
        const { id, amount, value, time, nonce, signature, type, lastB } = res.data;
        const receipt = await buySafeHouse({
          type,
          amount,
          value: token === 'FIAT' ? value : 0,
          lastB,
          time,
          nonce,
          signature,
        });

        if (receipt.status !== 1) throw new Error('Transaction failed');
        return receipt.transactionHash;
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const buyWorker = async ({ quantity, token }) => {
    try {
      if (token === 'xGANG') {
        await buyAssetsWithXToken({ type: 'worker', amount: quantity });
      } else {
        const res = await create({ type: 'buy-worker', amount: quantity, token });
        const { id, amount, value, time, nonce, signature, lastB } = res.data;
        const receipt = await buyGoon({ amount, value: token === 'FIAT' ? value : 0, lastB, time, nonce, signature });

        if (receipt.status !== 1) throw new Error('Transaction failed');
        return receipt.transactionHash;
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const buyGangster = async (quantity, mintFunction) => {
    try {
      const res = await create({ type: 'buy-machine', amount: quantity, mintFunction });
      const { amount, value, time, nGangster, nonce, bType, referrerAddress, signature } = res.data;
      const receipt = await buyMachine({
        amount,
        value,
        time,
        nGangster,
        nonce,
        bType,
        referrerAddress,
        signature,
      });
      if (receipt.status === 1) {
        return receipt.transactionHash;
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const initDailySpin = async () => {
    try {
      await delay(2000); // delay 2s to spin
      const res = await create({ type: 'daily-spin' });
      const { id, spinType, amount, value, lastSpin, time, nonce, signature } = res.data;
      const receipt = await dailySpin({ spinType, amount, value, lastSpin, time, nonce, signature });
      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }
      const txnHash = receipt.transactionHash;
      const res1 = await validateDailySpin({ transactionId: id, txnHash });
      const { result } = res1.data;
      gameRef.current?.events.emit('spin-result', { destinationIndex: result });
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const startRetirement = async () => {
    try {
      const res = await create({ type: 'retire' });
      const { id, value, nonce, signature } = res.data;
      const receipt = await retire({ value, nonce, numberOfGangsters: gamePlay.numberOfMachines, signature });
      if (receipt.status === 1) {
        return receipt.transactionHash;
      }
    } catch (err) {
      console.error(err);
      Sentry.captureException(err);
      throw err;
    }
  };

  const calculateClaimableRewardRef = useRef();
  calculateClaimableRewardRef.current = () => {
    if (!gamePlay?.startRewardCountingTime) return;
    const diffInDays = (Date.now() - gamePlay.startRewardCountingTime.toDate().getTime()) / MILISECONDS_IN_A_DAY;
    const claimableReward = gamePlay.pendingReward + diffInDays * dailyToken;
    gameRef.current?.events.emit('update-claimable-reward', { reward: claimableReward });
    gameRef.current?.events.emit('claimable-reward-added');
  };

  const calculateXTokenBalanceRef = useRef();
  calculateXTokenBalanceRef.current = () => {
    if (!gamePlay?.startXTokenCountingTime) return;
    const diffInDays = (Date.now() - gamePlay.startXTokenCountingTime.toDate().getTime()) / MILISECONDS_IN_A_DAY;
    const newEarnedXToken = diffInDays * dailyXToken;
    const newXTokenBalance = xTokenBalance + newEarnedXToken;
    console.log({ newXTokenBalance, startXTokenCountingTime: gamePlay?.startXTokenCountingTime });
    gameRef.current?.events.emit('update-xtoken-balance', { balance: newXTokenBalance });
  };

  const checkGameEndRef = useRef();
  checkGameEndRef.current = () => {
    if (!activeSeason) return;
    const { estimatedEndTime } = activeSeason;
    const now = Date.now();
    const endTime = estimatedEndTime.toDate().getTime();
    const isEnded = now >= endTime;
    if (isEnded) {
      gameRef.current?.events.emit('stop-animation');
    }
  };

  useEffect(() => {
    if (profile && gamePlay && activeSeasonId && !loaded && !!embeddedWallet) {
      setLoaded(true);
    }
  }, [loaded, profile, gamePlay, activeSeasonId, embeddedWallet]);

  useEffect(() => {
    if (rankData && rankData.data) {
      const { rank } = rankData.data;
      gameRef.current?.events.emit('update-rank', { rank });
    }
  }, [rankData]);

  useEffect(() => {
    if (!gameLoaded.current) {
      gameLoaded.current = true;

      const config = {
        type: Phaser.CANVAS,
        width,
        height,
        pixelArt: true,
        transparent: true,
        parent: 'game-container',
        fps: {
          target: 60,
        },
        scale: {
          mode: Phaser.Scale.FIT,
        },
        scene: [LoadingScene, TutorialScene, MainScene],
        debug: false,
        audio: {
          mute: sound !== 'on',
        },
        plugins: {
          global: [
            {
              key: 'rexCircleMaskImagePlugin',
              plugin: CircleMaskImagePlugin,
              start: true,
            },
          ],
        },
      };

      const game = new Phaser.Game(config);
      game.sound.setMute(sound !== 'on');

      game.events.on('hide-bg', () => {
        logAnalyticsEvent('game_load', { loading_duration: (Date.now() - startLoadingTime) / 1000 });
        setShowBg(false);
      });

      gameRef.current = game;
    }

    if (loaded && !gameEventListened.current) {
      gameEventListened.current = true;

      setupSimulatorGameListener(gameRef.current);

      gameRef.current?.events.on('check-user-completed-tutorial', () => {
        const completed = profile.completedTutorial;
        gameRef.current?.events.emit('update-user-completed-tutorial', { completed });
      });

      gameRef.current?.events.on('request-spin-rewards', () => {
        gameRef.current?.events.emit('update-spin-rewards', {
          spinRewards: JSON.parse(JSON.stringify(spinRewards)).sort((item1, item2) => item1.order - item2.order),
          spinPrice: calculateSpinPrice(networth),
        });
      });

      gameRef.current?.events.on('export-wallet', exportWallet);
      gameRef.current?.events.on('log-out', logout);
      gameRef.current?.events.on('toggle-game-sound', toggleSound);

      gameRef.current?.events.on('request-game-ended-status', () => {
        if (isEnded) gameRef.current?.events.emit('game-ended');
      });
      gameRef.current?.events.on('request-user-away-reward', async () => {
        try {
          if (!profile || !gamePlay?.startRewardCountingTime) return;
          const lastUnixTimeSeenWarResult = gamePlay?.lastTimeSeenWarResult
            ? gamePlay?.lastTimeSeenWarResult.toDate().getTime()
            : 0;
          const {
            data: { latestWar },
          } = await getLatestWar();
          const latestWarUnixTime = latestWar.createdAt;
          const showWarPopup = lastUnixTimeSeenWarResult < latestWarUnixTime;

          let startTime = gamePlay.startRewardCountingTime.toDate().getTime();
          if (profile.lastOnlineTime) {
            startTime = profile.lastOnlineTime.toDate().getTime();
          }

          const now = Date.now();
          const diffInDays = (now - startTime) / MILISECONDS_IN_A_DAY;
          const claimableReward = Math.abs(diffInDays * dailyToken);
          gameRef.current?.events.emit('update-user-away-reward', { showWarPopup, claimableReward });
          setOnlineListener(true);
        } catch (err) {
          console.error(err);
          Sentry.captureException(err);
        }
      });
      gameRef.current?.events.on('request-spinned-status', () => {
        if (spinInitialized) {
          gameRef.current?.events.emit('update-spinned-status', { spinned });
        }
      });
      gameRef.current?.events.on('request-app-version', () => {
        gameRef.current.events.emit('update-app-version', appVersion);
      });
      gameRef.current?.events.on('request-profile', () => {
        gameRef.current.events.emit('update-profile', { username, address, avatarURL: avatarURL_big ?? avatarURL });
      });
      gameRef.current?.events.on('open-leaderboard-modal', () => {
        setLeaderboardModalOpen(true);
        console.log('open-leaderboard-modal', 'invalidateQueries-QueryKeys.Leaderboard');
        queryClient.invalidateQueries({ queryKey: [QueryKeys.Leaderboard] });
        const { name, endTimeConfig, rankPrizePool, reputationPrizePool } = activeSeason || {};
        gameRef.current.events.emit('update-season', {
          name,
          endTimeConfig,
          prizePool: rankPrizePool + reputationPrizePool,
          isEnded,
        });
      });
      gameRef.current?.events.on('close-leaderboard-modal', () => {
        setLeaderboardModalOpen(false);
      });

      gameRef.current?.events.on('request-balances', () => {
        gameRef.current.events.emit('update-balances', { ETHBalance, tokenBalance });
      });

      gameRef.current?.events.on('request-deposit-code', () => {
        checkUserCode().catch((err) => {
          console.error(err);
          Sentry.captureException(err);
        });
        gameRef.current.events.emit('update-deposit-code', profile.code);
      });
      gameRef.current?.events.on('simulator-request-deposit-code', () => {
        checkUserCode().catch((err) => {
          console.error(err);
          Sentry.captureException(err);
        });
        gameRef.current.events.emit('simulator-update-deposit-code', profile.code);
      });
      gameRef.current?.events.on('request-eth-balance', async () => {
        try {
          const newBalance = await getETHBalance(address);
          console.log({ ETHBalance, newBalance });
          if (newBalance !== ETHBalance) {
            reloadBalance();
          }
          gameRef.current.events.emit('update-eth-balance', { address, ETHBalance: newBalance });
        } catch (err) {
          console.error(err);
          Sentry.captureException(err);
        }
      });
      gameRef.current?.events.on('refresh-eth-balance', () => {
        reloadBalance();
      });

      gameRef.current?.events.on('request-balances-for-withdraw', () => {
        gameRef.current.events.emit('update-balances-for-withdraw', {
          NFTBalance: numberOfMachines,
          ETHBalance,
          tokenBalance,
        });
      });
      gameRef.current?.events.on('request-wallet-nft-balance', () => {
        getNFTBalance(address)
          .then((balance) => {
            gameRef.current.events.emit('update-wallet-nft-balance', { balance, numberOfMachines });
          })
          .catch((err) => {
            console.error(err);
            Sentry.captureException(err);
          });
      });

      gameRef.current?.events.on('request-wallet-nft-unstaked', () => {
        getNFTBalance(address)
          .then((balance) => {
            gameRef.current.events.emit('update-wallet-nft-unstaked', { balance });
          })
          .catch((err) => {
            console.error(err);
            Sentry.captureException(err);
          });
      });

      gameRef.current?.events.on('request-rank', () => {
        getRank()
          .then((res) => gameRef.current.events.emit('update-rank', { rank: res.data.rank }))
          .catch((err) => {
            console.error(err);
            Sentry.captureException(err);
          });
      });

      gameRef.current?.events.on('request-networth', () => {
        gameRef.current.events.emit('update-networth', {
          networth,
          level: calculateHouseLevel(houseLevels, networth),
        });
      });

      gameRef.current?.events.on('request-claim-time', () => {
        gameRef.current.events.emit('update-claim-time', {
          claimGapInSeconds: activeSeason.claimGapInSeconds,
          lastClaimTime: gamePlay.lastClaimTime.toDate().getTime(),
          active: gamePlay.active,
        });
      });

      gameRef.current?.events.on('request-claimable-reward', () => calculateClaimableRewardRef.current?.());
      gameRef.current?.events.on('request-xtoken-balance', () => calculateXTokenBalanceRef.current?.());
      gameRef.current?.events.on('check-game-ended', () => checkGameEndRef.current?.());

      gameRef.current?.events.on('request-claimable-status', () => {
        const now = Date.now();
        const endUnixTime = activeSeason.estimatedEndTime.toDate().getTime();
        const nextClaimTime = gamePlay.lastClaimTime.toDate().getTime() + activeSeason.claimGapInSeconds * 1000;
        const claimable = now > nextClaimTime && now < endUnixTime;
        gameRef.current.events.emit('update-claimable-status', { claimable, active: gamePlay.active });
      });

      gameRef.current?.events.on('request-active-status', () => {
        gameRef.current.events.emit('update-active-status', { active: gamePlay.active });
      });

      gameRef.current?.events.on('request-war-history', () => {
        getWarHistory()
          .then((res) => gameRef.current.events.emit('update-war-history', res.data))
          .catch((err) => {
            console.error(err);
            Sentry.captureException(err);
          });
      });

      gameRef.current?.events.on('request-war-die-chance', () => {
        gameRef.current.events.emit('update-war-die-chance', { dieChance: activeSeason.warConfig.dieChance });
      });

      gameRef.current?.events.on('request-referral-config', () => {
        gameRef.current.events.emit('update-referral-config', activeSeason?.referralConfig);
      });

      gameRef.current?.events.on('request-invite-code', () => {
        if (inviteCode) gameRef.current.events.emit('update-invite-code', { code: inviteCode });
      });

      gameRef.current?.events.on('request-referral-data', () => {
        gameRef.current.events.emit('update-referral-data', {
          referralTotalReward,
          referralTotalDiscount,
          ethPriceInUsd,
          tweetTemplate: templates.twitterShareReferralCode || '',
        });
      });

      gameRef.current?.events.on('apply-invite-code', ({ code }) => {
        applyInviteCode({ code })
          .then(() =>
            gameRef.current.events.emit('complete-apply-invite-code', { status: 'Success', message: 'Success' })
          )
          .catch((err) => {
            console.log('err', err);
            gameRef.current.events.emit('complete-apply-invite-code', { status: 'Error', message: err.message });
          });
      });

      gameRef.current?.events.on('request-next-war-time', () => {
        getNextWarSnapshotUnixTime()
          .then((res) => {
            gameRef.current.events.emit('update-next-war-time', { time: res.data.time });
          })
          .catch((err) => {
            console.error(err);
            Sentry.captureException(err);
          });
      });

      gameRef.current?.events.on('withdraw-token', ({ amount, address }) => {
        transfer({ amount, address, tokenType: 'FIAT' });
      });
      gameRef.current?.events.on('withdraw-eth', ({ amount, address }) => {
        transfer({ amount, address, tokenType: 'ETH' });
      });
      gameRef.current?.events.on('withdraw-nft', ({ amount, address }) => {
        transfer({ amount, address, tokenType: 'NFT' });
      });
      gameRef.current?.events.on('deposit-nft', ({ amount }) => {
        stake(amount);
      });
      gameRef.current?.events.on('swap', async ({ tokenSwap, amount }) => {
        try {
          console.log({ tokenSwap, amount });
          gameRef.current.events.emit('swap-started', { amount, txnHash: '' });
          const func = tokenSwap === 'eth' ? swapEthToToken : swapTokenToEth;
          const { receipt, receiveAmount } = await func(amount);
          if (receipt.status === 1) {
            gameRef.current.events.emit('swap-completed', {
              txnHash: receipt.transactionHash,
              amount: receiveAmount,
              token: tokenSwap === 'eth' ? '$GANG' : 'ETH',
              description: tokenSwap === 'eth' ? 'Swap ETH to $GANG completed' : 'Swap $GANG to ETH completed',
            });
            reloadBalance();
          }
        } catch (err) {
          const { message, code } = handleError(err);
          gameRef.current?.events.emit('swap-completed', {
            status: 'failed',
            code,
            message,
          });
        }
      });

      gameRef.current?.events.on('claim', async () => {
        let amount;
        try {
          const res = await claimToken();
          amount = res.data.claimedAmount;
        } catch (err) {
          console.error(err);
          Sentry.captureException(err);
        }
        gameRef.current?.events.emit('claim-completed', { amount });
      });

      gameRef.current?.events.on('request-gas-mint', () => {
        gameRef.current.events.emit('update-gas-mint', { gas: estimatedGas?.game?.buyGangster });
      });

      gameRef.current?.events.on('request-gas-swap-eth-fiat', () => {
        gameRef.current.events.emit('update-gas-swap-eth-fiat', { gas: estimatedGas?.swap?.swapEthToToken });
      });

      gameRef.current?.events.on('request-gas-buy-goon', () => {
        gameRef.current.events.emit('update-gas-buy-goon', { gas: estimatedGas?.game?.buyGoon });
      });

      gameRef.current?.events.on('request-gas-upgrade-safehouse', () => {
        gameRef.current.events.emit('update-gas-upgrade-safehouse', { gas: estimatedGas?.game?.buySafeHouse });
      });

      gameRef.current?.events.on('upgrade-safehouse', async ({ quantity, token }) => {
        try {
          const txnHash = await buyBuilding({ quantity, token });
          gameRef.current?.events.emit('upgrade-safehouse-completed', { txnHash, amount: quantity });
        } catch (err) {
          const { message, code } = handleError(err);
          gameRef.current?.events.emit('upgrade-safehouse-completed', {
            status: 'failed',
            code,
            message,
          });
        }
      });

      gameRef.current?.events.on('request-buildings', () => {
        gameRef.current?.events.emit('update-buildings', {
          numberOfBuildings,
          networth,
          balance: tokenBalance,
          basePrice: building.basePrice,
          maxPerBatch: building.maxPerBatch,
          targetDailyPurchase: building.targetDailyPurchase,
          targetPrice: building.targetPrice,
          salesLastPeriod: buildingSoldLast24h,
          networthIncrease: building.networth,
        });
      });

      gameRef.current?.events.on('buy-goon', async ({ quantity, token }) => {
        try {
          const txnHash = await buyWorker({ quantity, token });
          gameRef.current?.events.emit('buy-goon-completed', { txnHash, amount: quantity });
        } catch (err) {
          const { message, code } = handleError(err);
          gameRef.current?.events.emit('buy-goon-completed', {
            status: 'failed',
            code,
            message,
          });
        }
      });

      gameRef.current?.events.on('daily-spin', async () => {
        try {
          await initDailySpin();
        } catch (err) {
          if (err.message === 'Already spin today') {
            gameRef.current?.events.emit('spin-error', {
              code: '4001',
              message: err.message,
            });
          } else {
            const { message, code } = handleError(err);
            gameRef.current?.events.emit('spin-error', {
              code,
              message,
            });
          }
        }
      });

      gameRef.current?.events.on('buy-gangster', async ({ quantity, mintFunction }) => {
        try {
          const txnHash = await buyGangster(quantity, mintFunction);
          gameRef.current?.events.emit('buy-gangster-completed', { txnHash, amount: quantity });
        } catch (err) {
          const { message, code } = handleError(err);
          gameRef.current?.events.emit('buy-gangster-completed', {
            status: 'failed',
            code,
            message,
          });
        }
      });

      gameRef.current?.events.on('init-retire', async () => {
        try {
          const txnHash = await startRetirement();
          gameRef.current?.events.emit('retire-completed', { txnHash });
        } catch (err) {
          const { message, code } = handleError(err);
          gameRef.current?.events.emit('retire-completed', {
            status: 'failed',
            code,
            message,
          });
        }
      });

      gameRef.current?.events.on('request-workers', () => {
        gameRef.current?.events.emit('update-workers', {
          numberOfWorkers,
          networth,
          balance: tokenBalance,
          basePrice: worker.basePrice,
          targetDailyPurchase: worker.targetDailyPurchase,
          targetPrice: worker.targetPrice,
          maxPerBatch: worker.maxPerBatch,
          salesLastPeriod: workerSoldLast24h,
          dailyReward: worker.dailyReward,
          networthIncrease: worker.networth,
        });
      });

      gameRef.current?.events.on('request-machines', () => {
        gameRef.current?.events.emit('update-machines', {
          numberOfMachines,
          networth,
          balance: tokenBalance,
          maxPerBatch: machine.maxPerBatch,
          dailyReward: machine.dailyReward,
          reservePool,
          reservePoolReward,
          networthIncrease: machine.networth,
          tokenPrice,
          isWhitelisted,
          whitelistAmountLeft: machine.maxWhitelistAmount - whitelistAmountMinted,
          hasInviteCode: Boolean(inviteCode),
          referralDiscount: inviteCode ? Number(activeSeason?.referralConfig?.referralDiscount) : 0,
        });
      });

      gameRef.current?.events.on('request-workers-machines', () => {
        gameRef.current?.events.emit('update-workers-machines', {
          numberOfWorkers,
          numberOfMachines,
        });
      });

      gameRef.current?.events.on('request-portfolio', () => {
        getRank().then((res) => {
          const { rankReward, reputationReward } = res.data;
          const tokenValue = tokenBalance * parseFloat(tokenPrice); // TODO: update formulas to calculate token value
          const machineValue = numberOfMachines * parseFloat(nftPrice); // TODO: update formulas to calculate machine value
          const totalBalance = parseFloat(ETHBalance) + tokenValue + machineValue + rankReward + reputationReward;
          gameRef.current?.events.emit('update-portfolio', {
            address,
            totalBalance,
            ETHBalance,
            tokenBalance,
            tokenValue,
            numberOfMachines,
            machineValue,
            rankReward,
            reputationReward,
          });
        });
      });

      gameRef.current?.events.on('request-statistic', () => {
        getRank().then((res) => {
          const { rank, totalPlayers } = res.data;
          gameRef.current?.events.emit('update-statistic', {
            rank,
            totalPlayers,
            networth,
            numberOfWorkers,
            numberOfMachines,
            numberOfBuildings,
          });
        });
      });

      gameRef.current?.events.on('request-referral-code', () => {
        gameRef.current?.events.emit('update-referral-code', referralCode);
      });

      gameRef.current?.events.on('check-user-loaded', () => {
        gameRef.current?.events.emit('user-info-loaded');
      });

      gameRef.current?.events.on('update-last-time-seen-war-result', () => {
        updateLastTimeSeenGangWarResult().catch((err) => {
          console.error(err);
          Sentry.captureException(err);
        });
      });

      gameRef.current?.events.on('request-ranking-rewards', () => {
        gameRef.current?.events.emit('update-ranking-rewards', { prizePoolConfig });
      });

      gameRef.current?.events.on('request-retire-data', () => {
        gameRef.current?.events.emit('update-retire-data', { earlyRetirementTax: prizePoolConfig.earlyRetirementTax });
      });

      gameRef.current?.events.on('request-game-play', () => {
        gameRef.current?.events.emit('update-game-play', {
          numberOfMachines,
          numberOfWorkers,
          numberOfBuildings,
          ...warDeployment,
          ...activeSeason.warConfig,
        });
      });

      gameRef.current?.events.on('update-war-machines', (data) => {
        updateUserWarMachines(data)
          .then(() => gameRef.current?.events.emit('update-war-machines-completed', data))
          .then(reloadUserWarDeployment)
          .catch((err) => {
            console.error(err);
            Sentry.captureException(err);
            gameRef.current?.events.emit('update-war-machines-error');
          });
      });

      gameRef.current?.events.on('convert-eth-input-to-token', ({ amount }) => {
        convertEthInputToToken(amount)
          .then((result) =>
            gameRef.current?.events.emit('convert-eth-input-to-token-result', {
              amount: result.amount,
              tradingFee: result.tradingFee,
              tradingFeeInUSD: result.tradingFeeInUSD,
            })
          )
          .catch((err) => {
            gameRef.current?.events.emit('swap-error');
            console.error(err);
            Sentry.captureException(err);
          });
      });
      gameRef.current?.events.on('request-gangster-price', async () => {
        Promise.all([convertEthInputToToken(machine.basePrice), convertEthInputToToken(machine.whitelistPrice)])
          .then(([resBasePrice, resWhitelistPrice]) => {
            gameRef.current?.events.emit('update-gangster-price', {
              basePrice: resBasePrice.amount,
              whitelistPrice: resWhitelistPrice.amount,
            });
          })
          .catch((err) => {
            console.error(err);
            Sentry.captureException(err);
          });
      });

      gameRef.current?.events.on('update-war-attack', (data) => {
        const { attackUserId } = data;

        updateUserWarAttack({ attackUserId })
          .then(() => {
            gameRef.current?.events.emit('update-war-attack-completed');
          })
          .then(reloadUserWarDeployment)
          .catch((err) => {
            console.error(err);
            Sentry.captureException(err);
          });
      });

      gameRef.current?.events.on('convert-eth-output-to-token', ({ amount }) => {
        convertEthOutputToToken(amount)
          .then((result) =>
            gameRef.current?.events.emit('convert-eth-output-to-token-result', {
              amount: result.amount,
              tradingFee: result.tradingFee,
              tradingFeeInUSD: result.tradingFeeInUSD,
            })
          )
          .catch((err) => {
            gameRef.current?.events.emit('swap-error');
            console.error(err);
            Sentry.captureException(err);
            if (err.message.includes('Not enough')) {
              enqueueSnackbar(err.message, { variant: 'error' });
            }
          });
      });

      gameRef.current?.events.on('request-war-config', () => {
        const { workerBonusMultiple, tokenRewardPerEarner, earningStealPercent, machinePercentLost } =
          activeSeason.warConfig;
        gameRef.current?.events.emit('update-war-config', {
          workerBonusMultiple,
          tokenRewardPerEarner,
          earningStealPercent,
          machinePercentLost,
        });
      });

      gameRef.current?.events.on('request-user-list-to-attack', ({ page, limit, search }) => {
        getUserListToAttack({ page, limit, search })
          .then((res) => {
            const { totalDocs, docs } = res.data;
            const totalPages = Math.ceil(totalDocs / limit);
            gameRef.current?.events.emit('update-user-list-to-attack', { totalPages, users: docs });
          })
          .catch((err) => {
            console.error(err);
            Sentry.captureException(err);
          });
      });

      gameRef.current?.events.on('convert-token-input-to-eth', ({ amount }) => {
        convertTokenInputToEth(amount)
          .then((result) =>
            gameRef.current?.events.emit('convert-token-input-to-eth-result', {
              amount: result.amount,
              tradingFee: result.tradingFee,
              tradingFeeInUSD: result.tradingFeeInUSD,
            })
          )
          .catch((err) => {
            gameRef.current?.events.emit('swap-error');
            console.error(err);
            Sentry.captureException(err);
          });
      });

      gameRef.current?.events.on('request-user-to-attack-detail', ({ userId }) => {
        getUserDetailToAttack(userId)
          .then((res) => {
            const { user, gamePlay, warResults } = res.data;
            gameRef.current?.events.emit('update-user-to-attack-detail', { user, gamePlay, warResults });
          })
          .catch((err) => {
            console.error(err);
            Sentry.captureException(err);
          });
      });
      gameRef.current?.events.on('convert-token-output-to-eth', ({ amount }) => {
        convertTokenOutputToEth(amount)
          .then((result) =>
            gameRef.current?.events.emit('convert-token-output-to-eth-result', {
              amount: result.amount,
              tradingFee: result.tradingFee,
              tradingFeeInUSD: result.tradingFeeInUSD,
            })
          )
          .catch((err) => {
            gameRef.current?.events.emit('swap-error');
            console.error(err);
            Sentry.captureException(err);
            if (err.message.includes('Not enough')) {
              enqueueSnackbar(err.message, { variant: 'error' });
            }
          });
      });

      gameRef.current?.events.on('request-war-history-detail', ({ warSnapshotId, warResultId }) => {
        getWarHistoryDetail({ warSnapshotId, warResultId })
          .then((res) => {
            gameRef.current?.events.emit('update-war-history-detail', res.data);
          })
          .catch((err) => {
            console.error(err);
            Sentry.captureException(err);
          });
      });

      gameRef.current?.events.on('request-war-history-latest', () => {
        getLatestWarResult()
          .then((res) => {
            gameRef.current?.events.emit('update-war-history-latest', res.data);
          })
          .catch((err) => {
            console.error(err);
            Sentry.captureException(err);
          });
      });

      gameRef.current?.events.on('enable-worker-sales-tracking', () => {
        enableWorkerSalesTracking();
      });

      gameRef.current?.events.on('enable-building-sales-tracking', () => {
        enableBuildingSalesTracking();
      });

      gameRef.current?.events.on('disable-worker-sales-tracking', () => {
        disableWorkerSalesTracking();
      });

      gameRef.current?.events.on('disable-building-sales-tracking', () => {
        disableBuildingSalesTracking();
      });

      gameRef.current?.events.on('request-goon-price', ({ timeMode }) => {
        console.log('begin request goon price', timeMode, Date.now());
        getWorkerPrices({ timeMode })
          .then((res) => gameRef.current?.events.emit('update-goon-price', res.data))
          .catch((err) => {
            console.error(err);
            Sentry.captureException(err);
          });
      });

      gameRef.current?.events.on('request-house-price', ({ timeMode }) => {
        console.log('begin request house price', timeMode, Date.now());
        getBuildingPrices({ timeMode })
          .then((res) => gameRef.current?.events.emit('update-house-price', res.data))
          .catch((err) => {
            console.error(err);
            Sentry.captureException(err);
          });
      });

      gameRef.current?.events.on('request-fee-percent', () => {
        getTotalFees()
          .then((res) => gameRef.current?.events.emit('update-fee-percent', { feePercent: res }))
          .catch((err) => {
            console.error(err);
            Sentry.captureException(err);
          });
      });

      gameRef.current?.events.on('request-auth', () => {
        gameRef.current?.events.emit('update-auth', { uid: profile.id });
      });

      gameRef.current?.events.emit('user-info-loaded');

      return () => {
        try {
          // gameRef.current?.scene.destroy();
        } catch (err) {
          console.error(err);
        }
      };
    }
  }, [loaded]);

  useEffect(() => {
    gameRef.current?.events.emit('update-app-version', appVersion);
  }, [appVersion]);

  useEffect(() => {
    if (isEnded) gameRef.current?.events.emit('game-ended');
  }, [isEnded]);

  useEffect(() => {
    gameRef.current?.events.emit('update-eth-balance', { address, ETHBalance });
  }, [address, ETHBalance]);

  useEffect(() => {
    gameRef.current?.events.emit('update-gas-mint', { gas: estimatedGas?.game?.buyGangster });
  }, [estimatedGas?.game?.buyGangster]);

  useEffect(() => {
    gameRef.current?.events.emit('update-gas-buy-goon', { gas: estimatedGas?.game?.buyGoon });
  }, [estimatedGas?.game?.buyGoon]);

  useEffect(() => {
    gameRef.current?.events.emit('update-gas-upgrade-safehouse', { gas: estimatedGas?.game?.buySafeHouse });
  }, [estimatedGas?.game?.buySafeHouse]);

  useEffect(() => {
    gameRef.current?.events.emit('update-balances', { ETHBalance, tokenBalance });
  }, [tokenBalance, ETHBalance]);

  useEffect(() => {
    gameRef.current?.events.emit('update-balances-for-withdraw', {
      NFTBalance: numberOfMachines,
      ETHBalance,
      tokenBalance,
    });
  }, [numberOfMachines, ETHBalance, tokenBalance]);

  useEffect(() => {
    gameRef.current?.events.emit('update-profile', { username, address, avatarURL: avatarURL_big ?? avatarURL });
  }, [username, address, avatarURL, avatarURL_big]);

  useEffect(() => {
    if (isLeaderboardModalOpen) {
      const { name, endTimeConfig, rankPrizePool, reputationPrizePool } = activeSeason || {};
      gameRef.current?.events.emit('update-season', {
        name,
        endTimeConfig,
        prizePool: rankPrizePool + reputationPrizePool,
        isEnded,
      });
    }
  }, [
    isLeaderboardModalOpen,
    activeSeason?.name,
    activeSeason?.endTimeConfig,
    activeSeason?.rankPrizePool,
    activeSeason?.reputationPrizePool,
    machine.networth,
    isEnded,
  ]);

  useEffect(() => {
    if (isLeaderboardModalOpen) gameRef.current?.events.emit('update-leaderboard', leaderboardData?.data || []);
  }, [isLeaderboardModalOpen, leaderboardData?.data]);

  useEffect(() => {
    gameRef.current?.events.emit('update-ranking-rewards', { prizePoolConfig });
  }, [prizePoolConfig]);

  useEffect(() => {
    gameRef.current?.events.emit('update-retire-data', {
      earlyRetirementTax: prizePoolConfig.earlyRetirementTax,
    });
  }, [prizePoolConfig.earlyRetirementTax]);

  useEffect(() => {
    gameRef.current?.events.emit('update-season-countdown', countdownString);
  }, [countdownString]);

  useEffect(() => {
    gameRef.current?.events.emit('update-active-status', { active: gamePlay?.active });
  }, [gamePlay?.active]);

  useEffect(() => {
    gameRef.current?.events.emit('game-sound-changed', { sound });
  }, [sound]);

  useEffect(() => {
    if (profile?.code) {
      gameRef.current.events.emit('update-deposit-code', profile?.code);
      gameRef.current.events.emit('simulator-update-deposit-code', profile?.code);
    }
  }, [profile?.code]);

  useEffect(() => {
    if (activeSeasonEstimatedEndTime && activeSeason?.claimGapInSeconds && gamePlay?.lastClaimTime) {
      gameRef.current?.events.emit('update-claim-time', {
        claimGapInSeconds: activeSeason?.claimGapInSeconds,
        lastClaimTime: gamePlay?.lastClaimTime?.toDate().getTime(),
        active: gamePlay.active,
      });

      const endUnixTime = activeSeason.estimatedEndTime.toDate().getTime();
      const nextClaimTime = gamePlay?.lastClaimTime.toDate().getTime() + activeSeason.claimGapInSeconds * 1000;
      const now = Date.now();
      const claimable = now > nextClaimTime && now < endUnixTime;
      gameRef.current?.events.emit('update-claimable-status', { claimable, active: gamePlay.active });
    }
  }, [activeSeasonEstimatedEndTime, activeSeason?.claimGapInSeconds, gamePlay?.lastClaimTime]);

  useEffect(() => {
    if (gamePlay?.startRewardCountingTime && gamePlay?.pendingReward) {
      const diffInDays = (Date.now() - gamePlay?.startRewardCountingTime.toDate().getTime()) / MILISECONDS_IN_A_DAY;
      const claimableReward = gamePlay?.pendingReward + diffInDays * dailyToken;
      gameRef.current?.events.emit('update-claimable-reward', { reward: claimableReward });
    }
  }, [gamePlay?.startRewardCountingTime, gamePlay?.pendingreward, dailyToken]);

  useEffect(() => {
    if (gamePlay) {
      gameRef.current?.events.emit('update-war-status', { war: gamePlay.war });
    }
  }, [gamePlay?.war]);

  useEffect(() => {
    getNFTBalance(address)
      .then((balance) => {
        gameRef.current?.events.emit('update-wallet-nft-balance', { balance, numberOfMachines });
      })
      .catch((err) => {
        console.error(err);
        Sentry.captureException(err);
      });
  }, [address, numberOfMachines]);

  useEffect(() => {
    gameRef.current?.events.emit('update-buildings', {
      numberOfBuildings,
      networth,
      balance: tokenBalance,
      basePrice: building.basePrice,
      maxPerBatch: building.maxPerBatch,
      targetDailyPurchase: building.targetDailyPurchase,
      targetPrice: building.targetPrice,
      salesLastPeriod: buildingSoldLast24h,
      networthIncrease: building.networth,
    });
  }, [numberOfBuildings, networth, tokenBalance, building, buildingSoldLast24h]);

  useEffect(() => {
    gameRef.current?.events.emit('update-workers', {
      numberOfWorkers,
      networth,
      balance: tokenBalance,
      basePrice: worker.basePrice,
      targetDailyPurchase: worker.targetDailyPurchase,
      targetPrice: worker.targetPrice,
      maxPerBatch: worker.maxPerBatch,
      salesLastPeriod: workerSoldLast24h,
      dailyReward: worker.dailyReward,
      networthIncrease: worker.networth,
    });
  }, [numberOfWorkers, networth, tokenBalance, worker, workerSoldLast24h]);

  useEffect(() => {
    gameRef.current?.events.emit('update-machines', {
      numberOfMachines,
      networth,
      balance: tokenBalance,
      maxPerBatch: machine.maxPerBatch,
      dailyReward: machine.dailyReward,
      reservePool,
      reservePoolReward,
      networthIncrease: machine.networth,
      tokenPrice,
      isWhitelisted: Boolean(isWhitelisted),
      whitelistAmountLeft: Number(machine.maxWhitelistAmount - whitelistAmountMinted),
      hasInviteCode: Boolean(inviteCode),
      referralDiscount: inviteCode ? Number(activeSeason?.referralConfig?.referralDiscount) : 0,
    });
  }, [
    numberOfMachines,
    networth,
    tokenBalance,
    machine,
    reservePool,
    reservePoolReward,
    tokenPrice,
    isWhitelisted,
    whitelistAmountMinted,
    inviteCode,
    activeSeason?.referralConfig?.referralDiscount,
  ]);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: [QueryKeys.Leaderboard] });
    gameRef.current?.events.emit('update-networth', {
      networth,
      level: calculateHouseLevel(houseLevels, networth),
    });
  }, [networth]);

  useEffect(() => {
    gameRef.current?.events.emit('update-referral-data', {
      referralTotalReward,
      referralTotalDiscount,
      ethPriceInUsd,
      tweetTemplate: templates.twitterShareReferralCode || '',
    });
  }, [referralTotalReward, referralTotalDiscount, ethPriceInUsd, templates.twitterShareReferralCode]);

  useEffect(() => {
    gameRef.current?.events.emit('update-workers-machines', { numberOfWorkers, numberOfMachines });
  }, [numberOfWorkers, numberOfMachines]);

  useEffect(() => {
    if (rankData?.data) {
      const { rankReward, reputationReward } = rankData.data;

      const tokenValue = tokenBalance * parseFloat(tokenPrice);
      const machineValue = numberOfMachines * parseFloat(nftPrice);
      const totalBalance = parseFloat(ETHBalance) + tokenValue + machineValue + rankReward + reputationReward;
      gameRef.current?.events.emit('update-portfolio', {
        address,
        totalBalance,
        ETHBalance,
        tokenBalance,
        tokenValue,
        numberOfMachines,
        machineValue,
        rankReward,
        reputationReward,
      });
    }
  }, [rankData, address, tokenBalance, numberOfMachines, ETHBalance]);

  useEffect(() => {
    if (rankData?.data) {
      const { rank, totalPlayers } = rankData.data;
      gameRef.current?.events.emit('update-statistic', {
        rank,
        totalPlayers,
        networth,
        numberOfWorkers,
        numberOfMachines,
        numberOfBuildings,
      });
    }
  }, [rankData, networth, numberOfWorkers, numberOfMachines, numberOfBuildings]);

  useEffect(() => {
    if (userHasInteractive) {
      gameRef.current?.events.emit('music-on');
    }
  }, [userHasInteractive]);

  useEffect(() => {
    gameRef.current?.events.emit('update-game-play', {
      numberOfMachines,
      numberOfWorkers,
      numberOfBuildings,
      ...warDeployment,
      ...warConfig,
    });
  }, [numberOfMachines, numberOfWorkers, numberOfBuildings, warDeployment, warConfig]);

  useEffect(() => {
    if (warConfig) {
      const { workerBonusMultiple, tokenRewardPerEarner, earningStealPercent, machinePercentLost } = warConfig;
      gameRef.current?.events.emit('update-war-config', {
        workerBonusMultiple,
        tokenRewardPerEarner,
        earningStealPercent,
        machinePercentLost,
      });
    }
  }, [warConfig]);

  useEffect(() => {
    if (gamePlay?.startXTokenCountingTime) {
      calculateXTokenBalanceRef.current?.();
    }
  }, [xTokenBalance, gamePlay?.startXTokenCountingTime]);

  useEffect(() => {
    gameRef.current?.events.emit('update-spin-rewards', {
      spinRewards: JSON.parse(JSON.stringify(spinRewards)).sort((item1, item2) => item1.order - item2.order),
      spinPrice: calculateSpinPrice(networth),
    });
  }, [spinRewards, networth]);

  useEffect(() => {
    if (spinInitialized) {
      gameRef.current?.events.emit('update-spinned-status', { spinned });
    }
  }, [spinInitialized, spinned]);

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height={`${localStorage.getItem('windowHeight')}px`}
      onClick={() => {
        !userHasInteractive && setUserHasInteracted(true);
      }}>
      <Box
        position="relative"
        id="game-container"
        width="100vw"
        height={`${localStorage.getItem('windowHeight')}px`}
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={
          showBg
            ? {
                backgroundImage: 'url(/images/bg-login.webp)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                '& canvas': { position: 'absolute' },
                '&::after': { content: '""', backgroundColor: 'rgba(0, 0, 0, 0.4)', width: '100%', height: '100%' },
              }
            : {}
        }>
        {showBg && (
          <>
            <Box position="absolute" top={0} left={0} width="100%" height="100%" zIndex={10}>
              <Box p={2} width="100%" display="flex" flexDirection="column" alignItems="center" gap={2}>
                <Box
                  mx="auto"
                  mt="20vh"
                  width={{ xs: '100%', sm: '600px' }}
                  display="flex"
                  flexDirection="column"
                  sx={{ maxWidth: '600px', '& img': { width: '100%' } }}>
                  <img src="/images/logo.svg" />
                </Box>
                <Box
                  width="100px"
                  mb={15}
                  sx={{
                    '& img': {
                      width: '100%',
                      animationName: 'spin',
                      animationDuration: '5000ms',
                      animationIterationCount: 'infinite',
                      animationTimingFunction: 'linear',
                    },
                  }}>
                  <img src="/images/icons/loading.png" />
                </Box>
                {userCanReload && (
                  <Box
                    alignSelf="center"
                    position="relative"
                    sx={{ cursor: 'pointer', userSelect: 'none' }}
                    onMouseDown={() => setMouseDown(true)}
                    onMouseUp={() => setMouseDown(false)}
                    onClick={() => {
                      logAnalyticsEvent('user_reload', {
                        loading_duration: (Date.now() - startLoadingTime) / 1000,
                      });
                      logout();
                      // window.location.reload();
                    }}>
                    <Box width="120px" sx={{ '& img': { width: '100%' } }}>
                      <img
                        draggable={false}
                        src={mouseDown ? '/images/button-blue-pressed.png' : '/images/button-blue.png'}
                        alt="button"
                      />
                    </Box>
                    <Box position="absolute" top="45%" left="50%" sx={{ transform: 'translate(-50%, -50%)' }}>
                      <Typography
                        fontSize={20}
                        fontWeight={700}
                        color="white"
                        fontFamily="WixMadeforDisplayBold"
                        sx={{ userSelect: 'none' }}>
                        Retry
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default Game;
