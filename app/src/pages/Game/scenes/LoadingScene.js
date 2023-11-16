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
        // font: 'bold 85px WixMadeforDisplay',
        fontSize: '85px',
        fontFamily: "'WixMadeforDisplay', sans-serif",
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
        fontFamily: "'WixMadeforDisplay', sans-serif",
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
    this.load.image('gangster-house-sign', '/images/gangster-house-sign.png');

    this.load.image('daily-money', '/images/daily-money.png');
    this.load.image('eth-balance', '/images/eth-balance.png');
    this.load.image('fiat-balance', '/images/fiat-balance.png');

    this.load.image('popup', '/images/popup.png');
    this.load.image('popup-small', '/images/popup-small.png');
    this.load.image('popup-large', '/images/popup-large.png');
    this.load.image('popup-title', '/images/popup-title.png');
    this.load.image('popup-welcome-nowar', '/images/popup-welcome-nowar.png');
    this.load.image('popup-buy', '/images/popup-buy.png');
    this.load.image('popup-war', '/images/popup-war.png');
    this.load.image('popup-daily-gang-war', '/images/popup-daily-gang-war.png');
    this.load.image('popup-safehouse-upgrade', '/images/popup-safehouse-upgrade.png');
    this.load.image('popup-buy-goon', '/images/popup-buy-goon.png');

    this.load.image('ribbon-welcome', '/images/ribbon-welcome.png');
    this.load.image('ribbon-daily-gang-war', '/images/ribbon-daily-gang-war.png');
    this.load.image('ribbon-safehouse-upgrade', '/images/ribbon-safehouse-upgrade.png');
    this.load.image('ribbon-buy-goon', '/images/ribbon-buy-goon.png');
    this.load.image('coin', '/images/coin.png');
    this.load.image('coin2', '/images/coin-2.png');
    this.load.image('slider-thumb', '/images/slider-thumb.png');

    this.load.image('button-blue', '/images/button-blue.png');
    this.load.image('button-blue-pressed', '/images/button-blue-pressed.png');
    this.load.image('button-blue-med', '/images/button-blue-med.png');
    this.load.image('button-blue-med-pressed', '/images/button-blue-med-pressed.png');
    this.load.image('button-red-med', '/images/button-red-med.png');
    this.load.image('button-red-med-pressed', '/images/button-red-med-pressed.png');
    this.load.image('button-blue-long', '/images/button-blue-long.png');
    this.load.image('button-blue-long-pressed', '/images/button-blue-long-pressed.png');
    this.load.image('button-green-long', '/images/button-green-long.png');
    this.load.image('button-green-long-pressed', '/images/button-green-long-pressed.png');
    this.load.image('button-close', '/images/button-close.png');
    this.load.image('button-close-pressed', '/images/button-close-pressed.png');
    this.load.image('button-copy', '/images/button-copy.png');
    this.load.image('button-copy-pressed', '/images/button-copy-pressed.png');
    this.load.image('button-buy', '/images/button-buy.png');
    this.load.image('button-buy-pressed', '/images/button-buy-pressed.png');
    this.load.image('button-war', '/images/button-war.png');
    this.load.image('button-war-pressed', '/images/button-war-pressed.png');
    this.load.image('button-portfolio', '/images/button-portfolio.png');
    this.load.image('button-portfolio-pressed', '/images/button-portfolio-pressed.png');
    this.load.image('button-rank', '/images/button-rank.png');
    this.load.image('button-rank-pressed', '/images/button-rank-pressed.png');
    this.load.image('button-referral', '/images/button-referral.png');
    this.load.image('button-referral-pressed', '/images/button-referral-pressed.png');
    this.load.image('button-setting', '/images/button-setting.png');
    this.load.image('button-setting-pressed', '/images/button-setting-pressed.png');
    this.load.image('button-add', '/images/button-add.png');
    this.load.image('button-add-pressed', '/images/button-add-pressed.png');
    this.load.image('button-claim', '/images/button-claim.png');
    this.load.image('button-claim-pressed', '/images/button-claim-pressed.png');

    // settings
    this.load.image('settings-wallet-container', '/images/settings-wallet-container.png');
    this.load.image('text-container', '/images/text-container.png');
    this.load.image('icon-settings', '/images/icons/settings.png');
    this.load.image('icon-logout', '/images/icons/logout.png');
    this.load.image('icon-sound-on', '/images/icons/sound-on.png');
    this.load.image('icon-sound-off', '/images/icons/sound-off.png');
    this.load.image('icon-coin', '/images/icons/coin.png');
    this.load.image('icon-eth', '/images/icons/eth.png');
    this.load.image('icon-gangster', '/images/icons/gangster.png');
    this.load.image('icon-chevron-right', '/images/icons/chevron-right.png');

    this.load.image('icon-history', '/images/icon-history.png');
    this.load.image('icon-war', '/images/icon-war.png');
    this.load.image('icon-checked', '/images/icon-checked.png');
    this.load.image('icon-unchecked', '/images/icon-unchecked.png');
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
