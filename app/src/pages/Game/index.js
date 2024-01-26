import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, alpha } from '@mui/material';
import Phaser from 'phaser';
import { useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { usePrivy } from '@privy-io/react-auth';
import * as Sentry from '@sentry/react';

import useUserStore from '../../stores/user.store';
import useSystemStore from '../../stores/system.store';
import useSettingStore from '../../stores/setting.store';
import {
  applyInviteCode,
  getRank,
  getWarHistory,
  getWarHistoryDetail,
  updateBalance,
  checkUserCode,
} from '../../services/user.service';
import { getWorkerPrices, getBuildingPrices } from '../../services/season.service';
import { claimToken } from '../../services/transaction.service';
import {
  getLeaderboard,
  getNextWarSnapshotUnixTime,
  getTotalVoters,
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
import { calculateHouseLevel } from '../../utils/formulas';
import useSmartContract from '../../hooks/useSmartContract';
import { create, validate } from '../../services/transaction.service';

import gameConfigs from './configs/configs';
import LoadingScene from './scenes/LoadingScene';
import MainScene from './scenes/MainScene';
import TutorialScene from './scenes/TutorialScene';
import useUserWallet from '../../hooks/useUserWallet';
import useSeasonCountdown from '../../hooks/useSeasonCountdown';
import useSimulatorGameListener from '../../hooks/useSimulatorGameListener';
import useSalesLast24h from '../../hooks/useSalesLast24h';

const { width, height } = gameConfigs;
const MILISECONDS_IN_A_DAY = 86400 * 1000;

const Game = () => {
  const { enqueueSnackbar } = useSnackbar();
  const embeddedWallet = useUserWallet();
  const [userHasInteractive, setUserHasInteracted] = useState(false);
  const gameRef = useRef();
  const gameLoaded = useRef();
  const gameEventListened = useRef();
  const [loaded, setLoaded] = useState(false);
  const profile = useUserStore((state) => state.profile);
  const gamePlay = useUserStore((state) => state.gamePlay);
  const activeSeason = useSystemStore((state) => state.activeSeason);
  const configs = useSystemStore((state) => state.configs);
  const market = useSystemStore((state) => state.market);
  const estimatedGas = useSystemStore((state) => state.estimatedGas);
  const sound = useSettingStore((state) => state.sound);
  const toggleSound = useSettingStore((state) => state.toggleSound);
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
  const { isEnded, countdownString } = useSeasonCountdown({ open: isLeaderboardModalOpen });
  const [showBg, setShowBg] = useState(true);
  const { workerSoldLast24h, buildingSoldLast24h, updateNow } = useSalesLast24h();

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // useEffect(() => {
  //   if (!!embeddedWallet) {
  //     console.log('swap', embeddedWallet);
  //     swapTokenToEth(10)
  //       .then(console.log)
  //       .catch((err) => console.log('error swap', err));
  //   }
  // }, [embeddedWallet]);

  const { appVersion } = configs || {};
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
    refetchInterval: 30 * 1000,
    retry: 3,
    onError: (err) => {
      Sentry.captureException(err);
    },
  });

  const {
    username,
    address,
    avatarURL,
    tokenBalance,
    ETHBalance,
    inviteCode,
    referralCode,
    referralTotalReward = 0,
    referralTotalDiscount = 0,
  } = profile || {
    tokenBalance: 0,
    ETHBalance: 0,
  };

  const { setupSimulatorGameListener } = useSimulatorGameListener({ leaderboardData });
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
  };

  const dailyMoney = numberOfMachines * machine.dailyReward + numberOfWorkers * worker.dailyReward;

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
          if (txnId) await validate({ transactionId: txnId, txnHash: receipt.transactionHash });
        }
      }
    } catch (err) {
      if (err.message === 'The user rejected the request') {
        gameRef.current?.events.emit(txnCompletedEvent, {
          code: '4001',
          amount,
          txnHash: '',
          status: 'failed',
          message: 'The user rejected\nthe request',
        });
      } else {
        console.error(err);
        Sentry.captureException(err);

        let message = err.message;
        let errorCode = err.code?.toString();
        if (!errorCode && message === 'Network Error') {
          errorCode = '12002';
        }
        gameRef.current?.events.emit(txnCompletedEvent, {
          status: 'failed',
          message: message,
          code: errorCode,
        });
      }
    }
  };

  const stake = async (amount) => {
    try {
      gameRef.current?.events.emit('deposit-nft-started');

      const receipt = await stakeNFT(address, amount);
      if (receipt.status === 1) {
        gameRef.current?.events.emit('deposit-nft-completed', { amount, txnHash: receipt.transactionHash });
      }
      enqueueSnackbar(`Staked gangster successfully`, { variant: 'success' });
    } catch (err) {
      err.message && enqueueSnackbar(err.message, { variant: 'error' });
      console.error(err);
      Sentry.captureException(err);
    }
  };

  const buyBuilding = async (quantity) => {
    try {
      const res = await create({ type: 'buy-building', amount: quantity });
      console.log(res);
      const { amount, value, nonce, signature } = res.data;
      const receipt = await buySafeHouse(amount, value, nonce, signature);

      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }
    } catch (err) {
      console.error(err);
      Sentry.captureException(err);
      throw err;
    }
  };

  const buyWorker = async (quantity) => {
    try {
      const res = await create({ type: 'buy-worker', amount: quantity });
      const { amount, value, nonce, signature } = res.data;
      const receipt = await buyGoon({ amount, value, nonce, signature });
      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }
    } catch (err) {
      console.error(err);
      Sentry.captureException(err);
      throw err;
    }
  };

  const buyGangster = async (quantity, mintFunction) => {
    try {
      const res = await create({ type: 'buy-machine', amount: quantity });
      const { id, amount, value, nonce, bonusAmount, signature, referrerAddress } = res.data;
      const receipt = await buyMachine({ amount, value, nonce, bonusAmount, signature, referrerAddress, mintFunction });
      if (receipt.status === 1) {
        await validate({ transactionId: id, txnHash: receipt.transactionHash });
        return receipt.transactionHash;
      }
    } catch (err) {
      console.error(err);
      Sentry.captureException(err);
      throw err;
    }
  };

  const startRetirement = async () => {
    try {
      const res = await create({ type: 'retire' });
      const { id, value, nonce, signature } = res.data;
      const receipt = await retire({ value, nonce, signature });
      if (receipt.status === 1) {
        await validate({ transactionId: id, txnHash: receipt.transactionHash });
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
    const claimableReward = gamePlay.pendingReward + diffInDays * dailyMoney;
    gameRef.current?.events.emit('update-claimable-reward', { reward: claimableReward });
    gameRef.current?.events.emit('claimable-reward-added');
  };

  const calculateBuyBonusRef = useRef();
  calculateBuyBonusRef.current = () => {
    if (!activeSeason?.startTime) return;
    gameRef.current?.events.emit('update-buy-bonus', {
      daysElapsed: (Date.now() - (activeSeason?.startTime.toDate().getTime() || Date.now())) / MILISECONDS_IN_A_DAY,
      gangsterDailyReward: machine.dailyReward,
    });
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
    if (profile && gamePlay && activeSeason && !loaded && !!embeddedWallet) {
      setLoaded(true);
    }
  }, [loaded, profile, gamePlay, activeSeason, embeddedWallet]);

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
      };

      const game = new Phaser.Game(config);
      game.sound.setMute(sound !== 'on');

      game.events.on('hide-bg', () => setShowBg(false));

      gameRef.current = game;
    }

    if (loaded && !gameEventListened.current) {
      gameEventListened.current = true;

      setupSimulatorGameListener(gameRef.current);

      gameRef.current?.events.on('check-user-completed-tutorial', () => {
        const completed = profile.completedTutorial;
        gameRef.current?.events.emit('update-user-completed-tutorial', { completed });
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

          const diffInDays = (Date.now() - startTime) / MILISECONDS_IN_A_DAY;
          const claimableReward = diffInDays * dailyMoney;
          gameRef.current?.events.emit('update-user-away-reward', { showWarPopup, claimableReward });
        } catch (err) {
          console.error(err);
          Sentry.captureException(err);
        }
      });
      gameRef.current?.events.on('request-app-version', () => {
        gameRef.current.events.emit('update-app-version', appVersion);
      });
      gameRef.current?.events.on('request-profile', () => {
        gameRef.current.events.emit('update-profile', { username, address, avatarURL });
      });
      gameRef.current?.events.on('open-leaderboard-modal', () => {
        setLeaderboardModalOpen(true);
        const { name, timeStepInHours, rankPrizePool, reputationPrizePool } = activeSeason || {};
        gameRef.current.events.emit('update-season', {
          name,
          timeStepInHours,
          prizePool: rankPrizePool + reputationPrizePool,
          isEnded,
        });
      });
      gameRef.current?.events.on('close-leaderboard-modal', () => {
        setLeaderboardModalOpen(false);
      });

      gameRef.current?.events.on('request-balances', () => {
        gameRef.current.events.emit('update-balances', { dailyMoney, ETHBalance, tokenBalance });
      });

      gameRef.current?.events.on('request-deposit-code', () => {
        checkUserCode().catch((err) => {
          console.error(err);
          Sentry.captureException(err);
        });
        gameRef.current.events.emit('update-deposit-code', profile.code);
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
      gameRef.current?.events.on('request-buy-bonus', () => calculateBuyBonusRef.current?.());
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
              token: tokenSwap === 'eth' ? '$FIAT' : 'ETH',
              description: tokenSwap === 'eth' ? 'Swap ETH to $FIAT completed' : 'Swap $FIAT to ETH completed',
            });
            reloadBalance();
          }
        } catch (err) {
          console.error(err);
          console.log({ err });
          let message = err.message;
          let errorCode = err.code?.toString();
          if (!errorCode && message === 'Network Error') {
            errorCode = '12002';
          }
          switch (err.code) {
            case 'UNPREDICTABLE_GAS_LIMIT':
              message = 'INSUFFICIENT GAS';
              break;
            case 'INSUFFICIENT_FUNDS':
              message = 'INSUFFICIENT ETH';
              break;
            default:
          }
          gameRef.current?.events.emit('swap-completed', {
            status: 'failed',
            message: message,
            code: errorCode || '4001',
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
        gameRef.current.events.emit('update-gas-mint', { gas: estimatedGas?.game?.mint });
      });

      gameRef.current?.events.on('request-gas-buy-goon', () => {
        gameRef.current.events.emit('update-gas-buy-goon', { gas: estimatedGas?.game?.buyGoon });
      });

      gameRef.current?.events.on('request-gas-upgrade-safehouse', () => {
        gameRef.current.events.emit('update-gas-upgrade-safehouse', { gas: estimatedGas?.game?.buySafeHouse });
      });

      gameRef.current?.events.on('upgrade-safehouse', async ({ quantity }) => {
        try {
          await buyBuilding(quantity);
          gameRef.current?.events.emit('upgrade-safehouse-completed');
        } catch (err) {
          let message = err.message;
          let errorCode = err.code?.toString();
          if (!errorCode && message === 'Network Error') {
            errorCode = '12002';
          }
          switch (err.code) {
            case 'UNPREDICTABLE_GAS_LIMIT':
              message = 'INSUFFICIENT GAS';
              break;
            case 'INSUFFICIENT_FUNDS':
              message = 'INSUFFICIENT ETH';
              break;
            default:
          }
          gameRef.current?.events.emit('upgrade-safehouse-completed', {
            status: 'failed',
            message: message,
            code: errorCode,
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

      gameRef.current?.events.on('buy-goon', async ({ quantity }) => {
        try {
          await buyWorker(quantity);
          gameRef.current?.events.emit('buy-goon-completed');
        } catch (err) {
          let message = err.message;
          let errorCode = err.code?.toString();
          if (!errorCode && message === 'Network Error') {
            errorCode = '12002';
          }
          switch (err.code) {
            case 'UNPREDICTABLE_GAS_LIMIT':
              message = 'INSUFFICIENT GAS';
              break;
            case 'INSUFFICIENT_FUNDS':
              message = 'INSUFFICIENT ETH';
              break;
            default:
          }
          gameRef.current?.events.emit('buy-goon-completed', { status: 'failed', message: message, code: errorCode });
        }
      });

      gameRef.current?.events.on('buy-gangster', async ({ quantity, mintFunction }) => {
        try {
          const txnHash = await buyGangster(quantity, mintFunction);
          gameRef.current?.events.emit('buy-gangster-completed', { txnHash, amount: quantity });
        } catch (err) {
          console.log({ err });
          let message = err.message;
          let errorCode = err.code?.toString();
          if (!errorCode && message === 'Network Error') {
            errorCode = '12002';
          }
          switch (errorCode) {
            case 'UNPREDICTABLE_GAS_LIMIT':
            case '-32603':
              message = 'INSUFFICIENT GAS';
              break;
            case 'INSUFFICIENT_FUNDS':
              message = 'INSUFFICIENT ETH';
              break;
            default:
          }
          gameRef.current?.events.emit('buy-gangster-completed', {
            status: 'failed',
            message: message,
            code: errorCode,
          });
        }
      });

      gameRef.current?.events.on('init-retire', async () => {
        try {
          const txnHash = await startRetirement();
          gameRef.current?.events.emit('retire-completed', { txnHash });
        } catch (err) {
          console.log({ err });
          let message = err.message;
          let errorCode = err.code?.toString();
          if (!errorCode && message === 'Network Error') {
            errorCode = '12002';
          }
          switch (errorCode) {
            case 'UNPREDICTABLE_GAS_LIMIT':
            case '-32603':
              message = 'INSUFFICIENT GAS';
              break;
            case 'INSUFFICIENT_FUNDS':
              message = 'INSUFFICIENT ETH';
              break;
            default:
          }
          gameRef.current?.events.emit('retire-completed', {
            status: 'failed',
            message: message,
            code: errorCode,
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
          balance: ETHBalance,
          basePrice: machine.basePrice,
          whitelistPrice: machine.whitelistPrice,
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
          const { reward: rankReward } = res.data;
          const tokenValue = tokenBalance * parseFloat(tokenPrice); // TODO: update formulas to calculate token value
          const machineValue = numberOfMachines * parseFloat(nftPrice); // TODO: update formulas to calculate machine value
          const totalBalance = parseFloat(ETHBalance) + tokenValue + machineValue + rankReward;
          gameRef.current?.events.emit('update-portfolio', {
            address,
            totalBalance,
            ETHBalance,
            tokenBalance,
            tokenValue,
            numberOfMachines,
            machineValue,
            rankReward,
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

      gameRef.current?.events.on('request-total-voters', () => {
        getTotalVoters()
          .then((res) => {
            gameRef.current?.events.emit('update-total-voters', { count: res.data.count });
          })
          .catch((err) => {
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

      gameRef.current?.events.on('update-war-attack', (data) => {
        const { attackUserId } = data;

        updateUserWarAttack({ attackUserId })
          .then(() => {
            gameRef.current?.events.emit('update-war-attack-completed');
          })
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
        const { tokenRewardPerEarner, earningStealPercent, machinePercentLost } = activeSeason.warConfig;
        gameRef.current?.events.emit('update-war-config', {
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

      gameRef.current?.events.on('update-price-worker-building', updateNow);

      gameRef.current?.events.on('request-goon-price', () => {
        getWorkerPrices()
          .then((res) => gameRef.current?.events.emit('update-goon-price', res.data))
          .catch((err) => {
            console.error(err);
            Sentry.captureException(err);
          });
      });

      gameRef.current?.events.on('request-house-price', () => {
        getBuildingPrices()
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
    gameRef.current?.events.emit('update-gas-mint', { gas: estimatedGas?.game?.mint });
  }, [estimatedGas?.game?.mint]);

  useEffect(() => {
    gameRef.current?.events.emit('update-gas-buy-goon', { gas: estimatedGas?.game?.buyGoon });
  }, [estimatedGas?.game?.buyGoon]);

  useEffect(() => {
    gameRef.current?.events.emit('update-gas-upgrade-safehouse', { gas: estimatedGas?.game?.buySafeHouse });
  }, [estimatedGas?.game?.buySafeHouse]);

  useEffect(() => {
    gameRef.current?.events.emit('update-balances', { dailyMoney, ETHBalance, tokenBalance });
  }, [tokenBalance, ETHBalance, dailyMoney]);

  useEffect(() => {
    gameRef.current?.events.emit('update-balances-for-withdraw', {
      NFTBalance: numberOfMachines,
      ETHBalance,
      tokenBalance,
    });
  }, [numberOfMachines, ETHBalance, tokenBalance]);

  useEffect(() => {
    gameRef.current?.events.emit('update-profile', { username, address, avatarURL });
  }, [username, address, avatarURL]);

  useEffect(() => {
    if (isLeaderboardModalOpen) {
      const { name, timeStepInHours, rankPrizePool, reputationPrizePool } = activeSeason || {};
      gameRef.current?.events.emit('update-season', {
        name,
        timeStepInHours,
        prizePool: rankPrizePool + reputationPrizePool,
        isEnded,
      });
    }
  }, [
    isLeaderboardModalOpen,
    activeSeason?.name,
    activeSeason?.timeStepInHours,
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
    }
  }, [profile?.code]);

  useEffect(() => {
    if (activeSeason?.estimatedEndTime && activeSeason?.claimGapInSeconds && gamePlay?.lastClaimTime) {
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
  }, [activeSeason?.estimatedEndTime, activeSeason?.claimGapInSeconds, gamePlay?.lastClaimTime]);

  useEffect(() => {
    if (gamePlay?.startRewardCountingTime && gamePlay?.pendingReward) {
      const diffInDays = (Date.now() - gamePlay?.startRewardCountingTime.toDate().getTime()) / MILISECONDS_IN_A_DAY;
      const claimableReward = gamePlay?.pendingReward + diffInDays * dailyMoney;
      gameRef.current?.events.emit('update-claimable-reward', { reward: claimableReward });
    }
  }, [gamePlay?.startRewardCountingTime, gamePlay?.pendingreward, dailyMoney]);

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
  }, [numberOfBuildings, networth, tokenBalance, building, workerSoldLast24h]);

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
  }, [numberOfWorkers, networth, tokenBalance, worker]);

  useEffect(() => {
    gameRef.current?.events.emit('update-machines', {
      numberOfMachines,
      networth,
      balance: ETHBalance,
      basePrice: machine.basePrice,
      whitelistPrice: machine.whitelistPrice,
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
    ETHBalance,
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
    gameRef.current?.events.emit('update-networth', {
      networth,
      level: calculateHouseLevel(houseLevels, networth),
    });
  }, [networth, houseLevels]);

  useEffect(() => {
    gameRef.current?.events.emit('update-referral-data', { referralTotalReward, referralTotalDiscount, ethPriceInUsd });
  }, [referralTotalReward, referralTotalDiscount, ethPriceInUsd]);

  useEffect(() => {
    gameRef.current?.events.emit('update-workers-machines', { numberOfWorkers, numberOfMachines });
  }, [numberOfWorkers, numberOfMachines]);

  useEffect(() => {
    if (rankData?.data) {
      const { reward: rankReward } = rankData.data;

      const tokenValue = tokenBalance * parseFloat(tokenPrice);
      const machineValue = numberOfMachines * parseFloat(nftPrice);
      const totalBalance = parseFloat(ETHBalance) + tokenValue + machineValue + rankReward;
      gameRef.current?.events.emit('update-portfolio', {
        address,
        totalBalance,
        ETHBalance,
        tokenBalance,
        tokenValue,
        numberOfMachines,
        machineValue,
        rankReward,
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
      ...activeSeason?.warConfig,
    });
  }, [numberOfMachines, numberOfWorkers, numberOfBuildings, warDeployment, activeSeason?.warConfig]);

  useEffect(() => {
    if (activeSeason?.warConfig) {
      const { tokenRewardPerEarner, earningStealPercent, machinePercentLost } = activeSeason.warConfig;
      gameRef.current?.events.emit('update-war-config', {
        tokenRewardPerEarner,
        earningStealPercent,
        machinePercentLost,
      });
    }
  }, [activeSeason?.warConfig]);

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
                backgroundImage: 'url(/images/bg-login.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                '& canvas': { position: 'absolute' },
              }
            : {}
        }>
        {showBg && (
          <>
            <Box position="absolute" top={0} left={0} width="100%" height="100%" bgcolor={alpha('#000', 0.4)}>
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
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default Game;
