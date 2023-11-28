import { useEffect, useMemo, useRef, useState } from 'react';
import { Box } from '@mui/material';
import Phaser from 'phaser';
import UIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';
import { useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { usePrivy } from '@privy-io/react-auth';

import useUserStore from '../../stores/user.store';
import useSystemStore from '../../stores/system.store';
import useSettingStore from '../../stores/setting.store';
import { getRank, getWarHistory, toggleWarStatus, updateBalance } from '../../services/user.service';
import { claimToken } from '../../services/transaction.service';
import { getLeaderboard, getNextWarSnapshotUnixTime } from '../../services/gamePlay.service';
import QueryKeys from '../../utils/queryKeys';
import { calculateHouseLevel } from '../../utils/formulas';
import useSmartContract from '../../hooks/useSmartContract';
import { create, validate } from '../../services/transaction.service';

import gameConfigs from './configs/configs';
import LoadingScene from './scenes/LoadingScene';
import MainScene from './scenes/MainScene';
import ExampleScene from './scenes/TestScene';
import useUserWallet from '../../hooks/useUserWallet';
import useSeasonCountdown from '../../hooks/useSeasonCountdown';

const { width, height } = gameConfigs;
const MILISECONDS_IN_A_DAY = 86400 * 1000;

const Game = () => {
  const { enqueueSnackbar } = useSnackbar();
  const embeddedWallet = useUserWallet();
  const [userHasInteractive, setUserHasInteracted] = useState(false);
  const gameRef = useRef();
  const gameLoaded = useRef();
  const [loaded, setLoaded] = useState(false);
  const profile = useUserStore((state) => state.profile);
  const gamePlay = useUserStore((state) => state.gamePlay);
  const activeSeason = useSystemStore((state) => state.activeSeason);
  const configs = useSystemStore((state) => state.configs);
  const market = useSystemStore((state) => state.market);
  const sound = useSettingStore((state) => state.sound);
  const toggleSound = useSettingStore((state) => state.toggleSound);
  const { getNFTBalance, withdrawToken, withdrawETH, withdrawNFT, stakeNFT, buyWorkerOrBuilding, buyMachine } =
    useSmartContract();
  const { ready, authenticated, user, exportWallet: exportWalletPrivy, logout } = usePrivy();
  const [isLeaderboardModalOpen, setLeaderboardModalOpen] = useState(false);
  const { isEnded, countdownString } = useSeasonCountdown({ open: isLeaderboardModalOpen });
  const { appVersion } = configs || {};
  const { tokenPrice, nftPrice } = market || {};

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
  });
  const { data: leaderboardData } = useQuery({
    queryKey: [QueryKeys.Leaderboard],
    queryFn: getLeaderboard,
    refetchInterval: 30 * 1000,
  });

  const { username, address, avatarURL, tokenBalance, ETHBalance } = profile || { tokenBalance: 0, ETHBalance: 0 };
  const { numberOfMachines, numberOfWorkers, numberOfBuildings, networth } = gamePlay || {
    numberOfMachines: 0,
    numberOfWorkers: 0,
    numberOfBuildings: 0,
    networth: 0,
  };
  const { machine, worker, building, workerSold, buildingSold, reservePool, reservePoolReward, houseLevels } =
    activeSeason || {
      machine: { dailyReward: 0, basePrice: 0, networth: 0 },
      worker: { dailyReward: 0, basePrice: 0, networth: 0, priceStep: 0 },
      building: { basePrice: 0, priceStep: 0, networth: 0 },
      buildingSold: 0,
      workerSold: 0,
      machineSold: 0,
      reservePool: 0,
      reservePoolReward: 0,
      houseLevels: [],
    };

  const dailyMoney = numberOfMachines * machine.dailyReward + numberOfWorkers * worker.dailyReward;

  const exportWallet = async () => {
    if (!isAuthenticated || !hasEmbeddedWallet) return;
    try {
      await exportWalletPrivy();
    } catch (error) {}
  };
  const reloadBalance = async () => {
    try {
      console.log('refreshing eth balance');
      await updateBalance();
    } catch (err) {
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

      const value = Number(amount);
      let txnId;
      if (tokenType === 'ETH') {
        const res = await create({ type: 'withdraw', token: tokenType, value, to: address });
        txnId = res.data.id;
      }
      const receipt = await web3Withdraw(address, value);
      // for test only
      // const receipt = { status: 1, transactionHash: 'test-txn-hash' };
      gameRef.current?.events.emit(txnStartedEvent, { amount, txnHash: receipt.transactionHash });
      if (receipt.status === 1) {
        if (txnId) await validate({ transactionId: txnId, txnHash: receipt.transactionHash });
        enqueueSnackbar(`Transferred ${tokenType} successfully`, { variant: 'success' });
      }
    } catch (err) {
      err.message && enqueueSnackbar(err.message, { variant: 'error' });
      console.error(err);
    } finally {
      gameRef.current?.events.emit(txnCompletedEvent);
    }
  };

  const stake = async (amount) => {
    try {
      const receipt = await stakeNFT(address, amount);
      if (receipt.status === 1) {
        gameRef.current?.events.emit('deposit-nft-started', { amount, txnHash: receipt.transactionHash });
      }
      enqueueSnackbar(`Staked gangster successfully`, { variant: 'success' });
    } catch (err) {
      err.message && enqueueSnackbar(err.message, { variant: 'error' });
      console.error(err);
    } finally {
      gameRef.current?.events.emit('deposit-nft-completed');
    }
  };

  const buy = async (buyType, quantity) => {
    try {
      const res = await create({ type: buyType, amount: quantity });
      const { id, amount, value, type } = res.data;
      const receipt = await buyWorkerOrBuilding(amount, value, type);
      if (receipt.status === 1) {
        await validate({ transactionId: id, txnHash: receipt.transactionHash });
      }
      enqueueSnackbar(`${buyType === 'buy-building' ? 'Upgrade safehouse' : 'Buy goon'} successfully`, {
        variant: 'success',
      });
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
      console.error(err);
    }
  };

  const buyGangster = async (quantity) => {
    try {
      const res = await create({ type: 'buy-machine', amount: quantity });
      const { id, amount, value } = res.data;
      const receipt = await buyMachine(amount, value);
      if (receipt.status === 1) {
        await validate({ transactionId: id, txnHash: receipt.transactionHash });
      }
      enqueueSnackbar('Buy Gangster successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
      console.error(err);
    }
  };

  const calculateClaimableRewardRef = useRef();
  calculateClaimableRewardRef.current = () => {
    if (!gamePlay.lastClaimTime) return;
    const diffInDays = (Date.now() - gamePlay.lastClaimTime.toDate().getTime()) / MILISECONDS_IN_A_DAY;
    const claimableReward = gamePlay.pendingReward + diffInDays * dailyMoney;
    gameRef.current?.events.emit('update-claimable-reward', { reward: claimableReward });
  };

  useEffect(() => {
    if (profile && gamePlay && activeSeason && !loaded && !!embeddedWallet) {
      setLoaded(true);
    }
  }, [loaded, profile, gamePlay, activeSeason, embeddedWallet]);

  useEffect(() => {
    if (rankData && rankData.data) {
      const { rank, reward } = rankData.data;
      gameRef.current?.events.emit('update-rank', { rank, reward });
    }
  }, [rankData]);

  useEffect(() => {
    if (loaded && !gameLoaded.current) {
      gameLoaded.current = true;
      const config = {
        type: Phaser.AUTO,
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
        scene: [LoadingScene, MainScene],
        debug: true,
        audio: {
          mute: sound !== 'on',
        },
      };

      const game = new Phaser.Game(config);
      game.sound.setMute(sound !== 'on');
      // listeners
      game.events.on('export-wallet', exportWallet);
      game.events.on('log-out', logout);
      game.events.on('toggle-game-sound', toggleSound);

      game.events.on('request-app-version', () => {
        gameRef.current.events.emit('update-app-version', appVersion);
      });
      game.events.on('request-profile', () => {
        gameRef.current.events.emit('update-profile', { username, address, avatarURL });
      });
      game.events.on('open-leaderboard-modal', () => {
        setLeaderboardModalOpen(true);
        const { name, timeStepInHours, prizePool } = activeSeason || {};
        gameRef.current.events.emit('update-season', {
          name,
          timeStepInHours,
          prizePool,
          isEnded,
          minNetworth: machine.networth,
        });
      });
      game.events.on('close-leaderboard-modal', () => {
        setLeaderboardModalOpen(false);
      });

      game.events.on('request-balances', () => {
        gameRef.current.events.emit('update-balances', { dailyMoney, ETHBalance, tokenBalance });
      });

      game.events.on('request-deposit-code', () => {
        gameRef.current.events.emit('update-deposit-code', '683382');
      });
      game.events.on('request-eth-balance', () => {
        gameRef.current.events.emit('update-eth-balance', ETHBalance);
      });
      game.events.on('refresh-eth-balance', () => {
        reloadBalance();
      });

      game.events.on('request-balances-for-withdraw', () => {
        gameRef.current.events.emit('update-balances-for-withdraw', {
          NFTBalance: numberOfMachines,
          ETHBalance,
          tokenBalance,
        });
      });
      game.events.on('request-wallet-nft-balance', () => {
        getNFTBalance(address).then((balance) => {
          console.log('balance', balance);
          gameRef.current.events.emit('update-wallet-nft-balance', balance);
        });
      });

      game.events.on('request-rank', () => {
        getRank()
          .then((res) => gameRef.current.events.emit('update-rank', { rank: res.data.rank, reward: res.data.reward }))
          .catch((err) => console.error(err));
      });

      game.events.on('request-networth', () => {
        gameRef.current.events.emit('update-networth', {
          networth,
          level: calculateHouseLevel(houseLevels, networth),
        });
      });

      game.events.on('request-claim-time', () => {
        gameRef.current.events.emit('update-claim-time', {
          claimGapInSeconds: activeSeason.claimGapInSeconds,
          lastClaimTime: gamePlay.lastClaimTime.toDate().getTime(),
          active: gamePlay.active,
        });
      });

      game.events.on('request-claimable-reward', () => calculateClaimableRewardRef.current?.());

      game.events.on('request-claimable-status', () => {
        console.log({ gamePlay });
        const nextClaimTime = gamePlay.lastClaimTime.toDate().getTime() + activeSeason.claimGapInSeconds * 1000;
        const claimable = Date.now() > nextClaimTime;
        gameRef.current.events.emit('update-claimable-status', { claimable, active: gamePlay.active });
      });

      game.events.on('request-war-history', () => {
        getWarHistory()
          .then((res) => gameRef.current.events.emit('update-war-history', res.data))
          .catch((err) => console.error(err));
      });

      game.events.on('request-war-status', () => {
        gameRef.current.events.emit('update-war-status', { war: gamePlay.war });
      });

      game.events.on('change-war-status', ({ war }) => {
        gameRef.current.events.emit('update-war-status', { war });
        toggleWarStatus({ war }).catch((err) => {
          console.error(err);
          gameRef.current.events.emit('update-war-status', { war: !war });
        });
      });

      game.events.on('request-next-war-time', () => {
        getNextWarSnapshotUnixTime()
          .then((res) => {
            gameRef.current.events.emit('update-next-war-time', { time: res.data.time });
          })
          .catch((err) => console.error(err));
      });

      game.events.on('withdraw-token', ({ amount, address }) => {
        transfer({ amount, address, tokenType: 'FIAT' });
      });
      game.events.on('withdraw-eth', ({ amount, address }) => {
        transfer({ amount, address, tokenType: 'ETH' });
      });
      game.events.on('withdraw-nft', ({ amount, address }) => {
        transfer({ amount, address, tokenType: 'NFT' });
      });
      game.events.on('deposit-nft', ({ amount }) => {
        stake(amount);
      });
      game.events.on('swap', ({ amount }) => {
        gameRef.current.events.emit('swap-started', { amount, txnHash: '' });
      });

      game.events.on('claim', async () => {
        try {
          await claimToken();
        } catch (err) {
          console.error(err);
        }
        game.events.emit('claim-completed');
      });

      game.events.on('upgrade-safehouse', async ({ quantity }) => {
        try {
          await buy('buy-building', quantity);
          game.events.emit('upgrade-safehouse-completed');
        } catch (err) {
          console.error(err);
        }
      });

      game.events.on('request-buildings', () => {
        game.events.emit('update-buildings', {
          numberOfBuildings,
          networth,
          balance: tokenBalance,
          sold: buildingSold,
          basePrice: building.basePrice,
          priceStep: building.priceStep,
          networthIncrease: building.networth,
        });
      });

      game.events.on('buy-goon', async ({ quantity }) => {
        try {
          await buy('buy-worker', quantity);
          game.events.emit('buy-goon-completed');
        } catch (err) {
          console.error(err);
        }
      });

      game.events.on('buy-gangster', async ({ quantity }) => {
        try {
          await buyGangster(quantity);
          game.events.emit('buy-gangster-completed');
        } catch (err) {
          console.error(err);
        }
      });

      game.events.on('request-reserve-pool', () => {
        game.events.emit('update-reserve-pool', { reservePool, reservePoolReward });
      });

      game.events.on('request-workers', () => {
        game.events.emit('update-workers', {
          numberOfWorkers,
          networth,
          balance: tokenBalance,
          sold: workerSold,
          basePrice: worker.basePrice,
          priceStep: worker.priceStep,
          dailyReward: worker.dailyReward,
          networthIncrease: worker.networth,
        });
      });

      game.events.on('request-machines', () => {
        game.events.emit('update-machines', {
          numberOfMachines,
          networth,
          balance: ETHBalance,
          basePrice: machine.basePrice,
          dailyReward: machine.dailyReward,
          reservePool,
          reservePoolReward,
          networthIncrease: machine.networth,
          tokenPrice,
        });
      });

      game.events.on('request-workers-machines', () => {
        game.events.emit('update-workers-machines', {
          numberOfWorkers,
          numberOfMachines,
        });
      });

      game.events.on('request-portfolio', () => {
        getRank().then((res) => {
          const { rank, reward: rankReward } = res.data;
          const tokenValue = tokenBalance * 0.000001; // TODO: update formulas to calculate token value
          const machineValue = numberOfMachines * 0.041; // TODO: update formulas to calculate machine value
          const totalBalance = ETHBalance + tokenValue + machineValue + rankReward;
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

      game.events.on('request-statistic', () => {
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

      game.events.on('request-referral-code', () => {
        gameRef.current?.events.emit('update-referral-code', profile.referralCode);
      });

      gameRef.current = game;

      return () => {
        try {
          // game.scene.destroy();
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
    gameRef.current?.events.emit('update-eth-balance', ETHBalance);
  }, [ETHBalance]);

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
      const { name, timeStepInHours, prizePool } = activeSeason || {};
      gameRef.current?.events.emit('update-season', {
        name,
        timeStepInHours,
        prizePool,
        isEnded,
        minNetworth: machine.networth,
      });
    }
  }, [
    isLeaderboardModalOpen,
    activeSeason?.name,
    activeSeason?.timeStepInHours,
    activeSeason?.prizePool,
    machine.networth,
    isEnded,
  ]);
  useEffect(() => {
    if (isLeaderboardModalOpen) gameRef.current?.events.emit('update-leaderboard', leaderboardData?.data || []);
  }, [isLeaderboardModalOpen, leaderboardData?.data]);
  useEffect(() => {
    if (isLeaderboardModalOpen)
      gameRef.current?.events.emit('update-ranking-rewards', activeSeason?.rankingRewards || []);
  }, [isLeaderboardModalOpen, activeSeason?.rankingRewards]);
  useEffect(() => {
    gameRef.current?.events.emit('update-season-countdown', countdownString);
  }, [countdownString]);

  useEffect(() => {
    gameRef.current?.events.emit('game-sound-changed', { sound });
  }, [sound]);

  useEffect(() => {
    if (activeSeason?.claimGapInSeconds && gamePlay?.lastClaimTime) {
      gameRef.current?.events.emit('update-claim-time', {
        claimGapInSeconds: activeSeason?.claimGapInSeconds,
        lastClaimTime: gamePlay?.lastClaimTime?.toDate().getTime(),
        active: gamePlay.active,
      });

      const nextClaimTime = gamePlay?.lastClaimTime.toDate().getTime() + activeSeason.claimGapInSeconds * 1000;
      const now = Date.now();
      const claimable = now > nextClaimTime;
      gameRef.current?.events.emit('update-claimable-status', { claimable, active: gamePlay.active });
    }
  }, [activeSeason?.claimGapInSeconds, gamePlay?.lastClaimTime]);

  useEffect(() => {
    if (gamePlay?.lastClaimTime && gamePlay?.pendingReward) {
      const diffInDays = (Date.now() - gamePlay?.lastClaimTime.toDate().getTime()) / MILISECONDS_IN_A_DAY;
      const claimableReward = gamePlay?.pendingReward + diffInDays * dailyMoney;
      gameRef.current?.events.emit('update-claimable-reward', { reward: claimableReward });
    }
  }, [gamePlay?.lastClaimTime, gamePlay?.pendingreward, dailyMoney]);

  useEffect(() => {
    if (gamePlay) {
      gameRef.current?.events.emit('update-war-status', { war: gamePlay.war });
    }
  }, [gamePlay?.war]);

  useEffect(() => {
    gameRef.current?.events.emit('update-buildings', {
      numberOfBuildings,
      networth,
      balance: tokenBalance,
      sold: buildingSold,
      basePrice: building.basePrice,
      priceStep: building.priceStep,
      networthIncrease: building.networth,
    });
  }, [numberOfBuildings, networth, tokenBalance, building, buildingSold]);

  useEffect(() => {
    gameRef.current?.events.emit('update-reserve-pool', { reservePool, reservePoolReward });
  }, [reservePool, reservePoolReward]);

  useEffect(() => {
    gameRef.current?.events.emit('update-workers', {
      numberOfWorkers,
      networth,
      balance: tokenBalance,
      sold: workerSold,
      basePrice: worker.basePrice,
      priceStep: worker.priceStep,
      dailyReward: worker.dailyReward,
      networthIncrease: worker.networth,
    });
  }, [numberOfWorkers, networth, tokenBalance, worker, workerSold]);

  useEffect(() => {
    gameRef.current?.events.emit('update-machines', {
      numberOfMachines,
      networth,
      balance: ETHBalance,
      basePrice: machine.basePrice,
      dailyReward: machine.dailyReward,
      reservePool,
      reservePoolReward,
      networthIncrease: machine.networth,
      tokenPrice,
    });
  }, [numberOfMachines, networth, ETHBalance, machine, reservePool, reservePoolReward, tokenPrice]);

  useEffect(() => {
    gameRef.current?.events.emit('update-networth', {
      networth,
      level: calculateHouseLevel(houseLevels, networth),
    });
  }, [networth, houseLevels]);

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

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      onClick={() => {
        !userHasInteractive && setUserHasInteracted(true);
      }}>
      <Box
        id="game-container"
        width="100vw"
        height="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      />
    </Box>
  );
};

export default Game;
