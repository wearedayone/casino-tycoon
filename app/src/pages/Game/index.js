import { useEffect, useMemo, useRef, useState } from 'react';
import { Box } from '@mui/material';
import Phaser from 'phaser';
import { useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { usePrivy } from '@privy-io/react-auth';

import useUserStore from '../../stores/user.store';
import useSystemStore from '../../stores/system.store';
import useSettingStore from '../../stores/setting.store';
import { getRank, toggleWarStatus } from '../../services/user.service';
import { claimToken } from '../../services/transaction.service';
import { getNextWarSnapshotUnixTime } from '../../services/gamePlay.service';
import QueryKeys from '../../utils/queryKeys';
import { calculateHouseLevel } from '../../utils/formulas';
import useSmartContract from '../../hooks/useSmartContract';
import { create, validate } from '../../services/transaction.service';

import configs from './configs/configs.json';
import LoadingScene from './scenes/LoadingScene';
import MainScene from './scenes/MainScene';
import ExampleScene from './scenes/TestScene';
import useUserWallet from '../../hooks/useUserWallet';

const { width, height } = configs;
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
  const sound = useSettingStore((state) => state.sound);
  const toggleSound = useSettingStore((state) => state.toggleSound);
  const { withdrawToken, withdrawETH, withdrawNFT, buyWorkerOrBuilding, buyMachine } = useSmartContract();
  const { ready, authenticated, user, exportWallet: exportWalletPrivy, logout } = usePrivy();

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

  const { username, address, avatarURL, tokenBalance, ETHBalance } = profile || { tokenBalance: 0, ETHBalance: 0 };
  const { numberOfMachines, numberOfWorkers, numberOfBuildings, networth } = gamePlay || {
    numberOfMachines: 0,
    numberOfWorkers: 0,
    numberOfBuildings: 0,
    networth: 0,
  };
  const { machine, worker, building, workerSold, buildingSold, reservePool, reservePoolReward, houseLevels } =
    activeSeason || {
      machine: { dailyReward: 0, basePrice: 0 },
      worker: { dailyReward: 0, basePrice: 0, priceStep: 0 },
      building: { basePrice: 0, priceStep: 0 },
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

  const transfer = async ({ amount, address, tokenType }) => {
    try {
      let web3Withdraw, txnStartedEvent;
      switch (tokenType) {
        case 'FIAT':
          web3Withdraw = withdrawToken;
          txnStartedEvent = 'withdraw-token-started';
          break;
        case 'ETH':
          web3Withdraw = withdrawETH;
          txnStartedEvent = 'withdraw-eth-started';
          break;
        case 'NFT':
          web3Withdraw = withdrawNFT;
          txnStartedEvent = 'withdraw-nft-started';
          break;
      }

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
      };

      const game = new Phaser.Game(config);

      // listeners
      game.events.on('export-wallet', exportWallet);
      game.events.on('log-out', logout);
      game.events.on('toggle-game-sound', toggleSound);

      game.events.on('request-profile', () => {
        gameRef.current.events.emit('update-profile', { username, address, avatarURL });
      });

      game.events.on('request-balances', () => {
        gameRef.current.events.emit('update-balances', { dailyMoney, ETHBalance, tokenBalance });
      });

      game.events.on('request-balances-for-withdraw', () => {
        gameRef.current.events.emit('update-balances-for-withdraw', {
          NFTBalance: numberOfMachines,
          ETHBalance,
          tokenBalance,
        });
      });

      game.events.on('request-rank', () => {
        getRank()
          .then((res) => gameRef.current.events.emit('update-rank', { rank: res.data.rank }))
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
        });
      });

      game.events.on('request-claimable-reward', () => {
        const diffInDays = (Date.now() - gamePlay.lastClaimTime.toDate().getTime()) / MILISECONDS_IN_A_DAY;
        const claimableReward = gamePlay.pendingReward + diffInDays * dailyMoney;
        gameRef.current.events.emit('update-claimable-reward', { reward: claimableReward });
      });

      game.events.on('request-claimable-status', () => {
        const nextClaimTime = gamePlay.lastClaimTime.toDate().getTime() + activeSeason.claimGapInSeconds * 1000;
        const claimable = Date.now() > nextClaimTime;
        gameRef.current.events.emit('update-claimable-status', { claimable });
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

      game.events.on('request-workers', () => {
        game.events.emit('update-workers', {
          numberOfWorkers,
          networth,
          balance: tokenBalance,
          sold: workerSold,
          basePrice: worker.basePrice,
          priceStep: worker.priceStep,
          dailyReward: worker.dailyReward,
        });
      });

      game.events.on('request-machines', () => {
        game.events.emit('update-machines', {
          numberOfMachines,
          networth,
          balance: ETHBalance,
          basePrice: machine.basePrice,
          dailyReward: machine.dailyReward,
          bonus: reservePool * reservePoolReward,
        });
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
    gameRef.current?.events.emit('game-sound-changed', { sound });
  }, [sound]);

  useEffect(() => {
    if (activeSeason?.claimGapInSeconds && gamePlay?.lastClaimTime) {
      gameRef.current?.events.emit('update-claim-time', {
        claimGapInSeconds: activeSeason?.claimGapInSeconds,
        lastClaimTime: gamePlay?.lastClaimTime?.toDate().getTime(),
      });

      const nextClaimTime = gamePlay?.lastClaimTime.toDate().getTime() + activeSeason.claimGapInSeconds * 1000;
      const now = Date.now();
      const claimable = now > nextClaimTime;
      gameRef.current?.events.emit('update-claimable-status', { claimable });
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
    });
  }, [numberOfBuildings, networth, tokenBalance, building, buildingSold]);

  useEffect(() => {
    gameRef.current?.events.emit('update-workers', {
      numberOfWorkers,
      networth,
      balance: tokenBalance,
      sold: workerSold,
      basePrice: worker.basePrice,
      priceStep: worker.priceStep,
      dailyReward: worker.dailyReward,
    });
  }, [numberOfWorkers, networth, tokenBalance, worker, workerSold]);

  useEffect(() => {
    gameRef.current?.events.emit('update-machines', {
      numberOfMachines,
      networth,
      balance: tokenBalance,
      basePrice: machine.basePrice,
      dailyReward: machine.dailyReward,
      bonus: reservePool * reservePoolReward,
    });
  }, [numberOfMachines, networth, ETHBalance, machine, reservePool, reservePoolReward]);

  useEffect(() => {
    gameRef.current?.events.emit('update-networth', {
      networth,
      level: calculateHouseLevel(houseLevels, networth),
    });
  }, [networth, houseLevels]);

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
