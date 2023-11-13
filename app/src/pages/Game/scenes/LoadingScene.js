import Phaser from 'phaser';

import configs from '../configs/configs.json';

class LoadingScene extends Phaser.Scene {
  constructor() {
    super('LoadingScene');
  }

  preload() {
    this.cameras.main.setBackgroundColor('#6123ff');
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(100, configs.height / 2 - 100, configs.width - 200, 200);

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 200,
      text: 'Loading...',
      style: {
        fontSize: '85px',
        fontFamily: "'Wix Madefor Display', sans-serif",
        fill: '#ffffff',
      },
    });
    loadingText.setOrigin(0.5, 0.5);

    const percentText = this.make.text({
      x: width / 2,
      y: height / 2,
      text: '0%',
      style: {
        fontSize: '85px',
        fontFamily: "'Wix Madefor Display', sans-serif",
        fill: '#ffffff',
      },
    });
    percentText.setOrigin(0.5, 0.5);

    this.load.on('progress', function (value) {
      percentText.setText(parseInt(value * 100) + '%');
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(100, configs.height / 2 - 100, (configs.width - 200) * value, 200);
    });

    this.load.on('complete', function () {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    this.load.image('bg', '/images/bg.png');
    this.load.image('gangster-house-1', '/images/gangster-house-1.png');
    this.load.image('gangster-house-2', '/images/gangster-house-2.png');
    this.load.image('gangster-house-3', '/images/gangster-house-3.png');

    this.load.image('popup', '/images/popup.png');
    this.load.image('popup-title', '/images/popup-title.png');
    this.load.image('button-close', '/images/button-close.png');
    this.load.image('button-close-pressed', '/images/button-close-pressed.png');
  }

  create() {
    this.cameras.main.setBackgroundColor('#6123ff');
    this.cameras.main.fadeOut(1000, 30, 195, 255);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam, effect) => {
      this.time.delayedCall(100, () => {
        this.scene.start('MainScene');
      });
    });
  }
}

export default LoadingScene;
