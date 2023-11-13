import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import Phaser from 'phaser';

import configs from './configs/configs.json';
import LoadingScene from './scenes/LoadingScene';
import MainScene from './scenes/MainScene';

const { width, height } = configs;

const Game = () => {
  const gameRef = useRef();
  const loaded = useRef();

  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true;
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

      return () => {
        try {
          // game.scene.destroy();
        } catch (err) {
          console.error(err);
        }
      };
    }
  }, []);

  return (
    <Box minHeight="100vh" overflow="auto" display="flex" justifyContent="center" alignItems="center">
      <Box id="game-container" width="600px" maxWidth="100vw" sx={{ aspectRatio: '1290/2796' }} />
    </Box>
  );
};

export default Game;
