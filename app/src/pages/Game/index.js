import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Phaser from 'phaser';
import { useQuery } from '@tanstack/react-query';

import useUserStore from '../../stores/user.store';
import useSystemStore from '../../stores/system.store';
import useSettingStore from '../../stores/setting.store';
import { getRank, toggleWarStatus } from '../../services/user.service';
import { claimToken } from '../../services/transaction.service';
import { getNextWarSnapshotUnixTime } from '../../services/gamePlay.service';
import QueryKeys from '../../utils/queryKeys';

import configs from './configs/configs.json';
import LoadingScene from './scenes/LoadingScene';
import MainScene from './scenes/MainScene';

const { width, height } = configs;
const MILISECONDS_IN_A_DAY = 86400 * 1000;

const Game = () => {
  const navigate = useNavigate();
  const gameRef = useRef();
  const gameLoaded = useRef();
  const [loaded, setLoaded] = useState(false);
  const profile = useUserStore((state) => state.profile);
  const gamePlay = useUserStore((state) => state.gamePlay);
  const activeSeason = useSystemStore((state) => state.activeSeason);
  const sound = useSettingStore((state) => state.sound);
  const toggleSound = useSettingStore((state) => state.toggleSound);

  const { status, data: rankData } = useQuery({
    queryFn: getRank,
    queryKey: [QueryKeys.Rank, profile?.id],
    enabled: !!profile?.id,
    refetchInterval: 30 * 1000,
  });

  const { username, address, avatarURL, tokenBalance, ETHBalance } = profile || { tokenBalance: 0, ETHBalance: 0 };
  const { numberOfMachines, numberOfWorkers } = gamePlay || { numberOfMachines: 0, numberOfWorkers: 0 };
  const { machine, worker } = activeSeason || { machine: { dailyReward: 0 }, worker: { dailyReward: 0 } };

  const dailyMoney = numberOfMachines * machine.dailyReward + numberOfWorkers * worker.dailyReward;

  useEffect(() => {
    if (profile && gamePlay && activeSeason && !loaded) {
      setLoaded(true);
    }
  }, [loaded, profile, gamePlay, activeSeason]);

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
      game.events.on('toggle-game-sound', toggleSound);

      game.events.on('request-profile', () => {
        gameRef.current.events.emit('update-profile', { username, address, avatarURL });
      });

      game.events.on('request-balances', () => {
        gameRef.current.events.emit('update-balances', { dailyMoney, ETHBalance, tokenBalance });
      });

      game.events.on('request-rank', () => {
        getRank()
          .then((res) => gameRef.current.events.emit('update-rank', { rank: res.data.rank }))
          .catch((err) => console.error(err));
      });

      game.events.on('request-networth', () => {
        gameRef.current.events.emit('update-networth', { networth: gamePlay.networth });
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

      game.events.on('claim', async () => {
        try {
          await claimToken();
        } catch (err) {
          console.error(err);
        }
        game.events.emit('claim-completed');
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

  return (
    <Box display="flex" justifyContent="center" alignItems="center">
      <button style={{ position: 'fixed', top: 20, left: 20 }} onClick={() => navigate('/')}>
        Home
      </button>
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
