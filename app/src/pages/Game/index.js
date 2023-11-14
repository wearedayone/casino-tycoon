import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import Phaser from 'phaser';
import { useQuery } from '@tanstack/react-query';

import useUserStore from '../../stores/user.store';
import useSystemStore from '../../stores/system.store';
import { getRank } from '../../services/user.service';
import QueryKeys from '../../utils/queryKeys';

import configs from './configs/configs.json';
import LoadingScene from './scenes/LoadingScene';
import MainScene from './scenes/MainScene';

const { width, height } = configs;

const Game = () => {
  const gameRef = useRef();
  const gameLoaded = useRef();
  const [loaded, setLoaded] = useState(false);
  const profile = useUserStore((state) => state.profile);
  const gamePlay = useUserStore((state) => state.gamePlay);
  const activeSeason = useSystemStore((state) => state.activeSeason);

  const { status, data: rankData } = useQuery({
    queryFn: getRank,
    queryKey: [QueryKeys.Rank, profile?.id],
    enabled: !!profile?.id,
    refetchInterval: 30 * 1000,
  });

  const { tokenBalance, ETHBalance } = profile || { tokenBalance: 0, ETHBalance: 0 };
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
      game.events.on('', () => {});

      gameRef.current = game;
      gameRef.current.events.on('request-balances', () => {
        gameRef.current.events.emit('update-balances', { dailyMoney, ETHBalance, tokenBalance });
      });

      gameRef.current.events.on('request-rank', () => {
        gameRef.current.events.emit('update-rank', { rank: rankData?.data?.rank || '' });
      });

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

  return (
    <Box minHeight="100vh" overflow="auto" display="flex" justifyContent="center" alignItems="center">
      <Box id="game-container" width="600px" maxWidth="100vw" sx={{ aspectRatio: '1290/2796' }} />
    </Box>
  );
};

export default Game;
