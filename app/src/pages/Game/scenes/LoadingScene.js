import Phaser from 'phaser';

import configs from '../configs/configs';

const logoRatio = 10 / 3;
const loadingIconRatio = 100 / 109;
const isXS = window.innerWidth < 600;
const logoWidth = isXS ? window.innerWidth - 32 : Math.min(600, window.innerWidth - 32);
const logoHeight = logoWidth / logoRatio;
const loadingIconWidth = 100;
const loadingIconHeight = loadingIconWidth / loadingIconRatio;

const windowLoadingTextY = 0.2 * window.innerHeight + logoHeight + 16 + loadingIconHeight + 32;

class LoadingScene extends Phaser.Scene {
  assetLoaded = false;
  userInfoLoaded = false;
  loadingPercent = 0;

  constructor() {
    super('LoadingScene');
  }

  preload() {
    const loadingTextY = (windowLoadingTextY * configs.height) / window.innerHeight;
    const progressY = loadingTextY + 150;
    this.game.events.on('user-info-loaded', () => {
      this.userInfoLoaded = true;
    });

    // this.cameras.main.setBackgroundColor('#6123ff');
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0xffffff, 1);
    progressBox.fillRect(100, progressY, configs.width - 200, 200);
    const progressBar = this.add.graphics();

    const width = this.cameras.main.width;
    // const height = this.cameras.main.height;
    const loadingText = this.make.text({
      x: width / 2,
      y: loadingTextY,
      text: 'Loading game assets & profile...',
      style: {
        // font: 'bold 85px WixMadeforDisplay',
        fontSize: '78px',
        fontFamily: "'WixMadeforDisplayBold', sans-serif",
        fill: '#ffffff',
      },
    });
    loadingText.setOrigin(0.5, 0);
    loadingText.setStroke('#000000', 6);

    const percentText = this.make.text({
      x: width / 2,
      y: progressY + 100,
      text: '0%',
      style: {
        fontSize: '78px',
        fontFamily: "'WixMadeforDisplayBold', sans-serif",
        fill: '#000000',
      },
    });
    percentText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value) => {
      if (value * 100 < this.loadingPercent) return;
      this.loadingPercent = parseInt(value * 100);
      percentText.setText(this.loadingPercent + '%');
      progressBar.clear();
      progressBar.fillStyle(0x1026fc, 0.8);
      progressBar.fillRect(100, progressY, (configs.width - 200) * value, 200);
    });

    this.load.on('complete', () => {
      this.assetLoaded = true;
    });

    this.load.scenePlugin(
      'rexuiplugin',
      'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js',
      'rexUI',
      'rexUI'
    );

    // sounds
    this.load.audio('bg', '/audios/bg.wav');
    this.load.audio('button-1', '/audios/button-1.wav');
    this.load.audio('button-2', '/audios/button-2.wav');
    this.load.audio('buy', '/audios/buy.wav');
    this.load.audio('open', '/audios/open.wav');
    this.load.audio('close', '/audios/close.wav');
    this.load.audio('coin', '/audios/coin.wav');
    this.load.audio('coinbag-dropoff', '/audios/coinbag-dropoff.mp3');
    this.load.audio('coinbag-pickup', '/audios/coinbag-pickup.mp3');
    this.load.audio('gangster', '/audios/gangster.wav');
    this.load.audio('house', '/audios/house.wav');
    this.load.audio('minion', '/audios/minion.wav');
    this.load.audio('war', '/audios/war.wav');
    this.load.audio('toggle-1', '/audios/toggle-1.wav');
    this.load.audio('toggle-2', '/audios/toggle-2.wav');

    this.load.image('bg', '/images/bg_full.png');
    this.load.image('gangster-house-1', '/images/gangster-house-1.png');
    this.load.image('gangster-house-2', '/images/gangster-house-2.png');
    this.load.image('gangster-house-3', '/images/gangster-house-3.png');
    this.load.image('gangster-house-4', '/images/gangster-house-4.png');
    this.load.image('gangster-house-5', '/images/gangster-house-5.png');
    this.load.image('gangster-house-6', '/images/gangster-house-6.png');
    this.load.image('gangster-house-7', '/images/gangster-house-7.png');
    this.load.image('gangster-house-8', '/images/gangster-house-8.png');
    this.load.image('gangster-house-9', '/images/gangster-house-9.png');
    this.load.image('gangster-house-10', '/images/gangster-house-10.png');
    this.load.image('gangster-house-11', '/images/gangster-house-11.png');
    this.load.image('gangster-house-12', '/images/gangster-house-12.png');
    this.load.image('gangster-house-13', '/images/gangster-house-13.png');
    this.load.image('gangster-house-14', '/images/gangster-house-14.png');
    this.load.image('gangster-house-15', '/images/gangster-house-15.png');
    this.load.image('gangster-house-sign', '/images/gangster-house-sign.png');

    this.load.image('daily-money', '/images/daily-money.png');
    this.load.image('eth-balance', '/images/eth-balance.png');
    this.load.image('fiat-balance', '/images/fiat-balance.png');

    this.load.image('popup', '/images/popup.png');
    this.load.image('popup-small', '/images/popup-small.png');
    this.load.image('popup-medium', '/images/popup-medium.png');
    this.load.image('popup-large', '/images/popup-large.png');
    this.load.image('popup-extra-large', '/images/popup-extra-large.png');
    this.load.image('popup-title', '/images/popup-title.png');
    this.load.image('popup-title-large', '/images/popup-title-large.png');
    this.load.image('popup-welcome-war', '/images/popup-welcome-war.png');
    this.load.image('popup-welcome-nowar', '/images/popup-welcome-nowar.png');
    this.load.image('popup-buy', '/images/popup-buy.png');
    this.load.image('popup-war', '/images/popup-war.png');
    this.load.image('popup-daily-gang-war', '/images/popup-daily-gang-war.png');
    this.load.image('popup-safehouse-upgrade', '/images/popup-safehouse-upgrade.png');
    this.load.image('popup-buy-goon', '/images/popup-buy-goon.png');
    this.load.image('popup-buy-gangster', '/images/popup-buy-gangster.png');
    this.load.image('popup-portfolio', '/images/popup-portfolio.png');
    this.load.image('popup-statistic', '/images/popup-statistic.png');
    this.load.image('popup_referral', '/images/popup_referral.png');

    this.load.image('ribbon-welcome', '/images/ribbon-welcome.png');
    this.load.image('ribbon-daily-gang-war', '/images/ribbon-daily-gang-war.png');
    this.load.image('ribbon-safehouse-upgrade', '/images/ribbon-safehouse-upgrade.png');
    this.load.image('ribbon-buy-goon', '/images/ribbon-buy-goon.png');
    this.load.image('ribbon-buy-gangster', '/images/ribbon-buy-gangster.png');
    this.load.image('ribbon-portfolio', '/images/ribbon-portfolio.png');
    this.load.image('ribbon-statistic', '/images/ribbon-statistic.png');
    this.load.image('ribbon-referral', '/images/ribbon-referral.png');

    this.load.image('glow', '/images/glow.png');
    this.load.image('coin', '/images/coin.png');
    this.load.image('coin2', '/images/coin-2.png');
    this.load.image('eth-coin', '/images/eth-coin.png');
    this.load.image('slider-thumb', '/images/slider-thumb.png');
    this.load.image('counter', '/images/counter.png');

    this.load.image('button-approve', '/images/button-approve.png');
    this.load.image('button-approve-pressed', '/images/button-approve-pressed.png');
    this.load.image('button-approve-disabled', '/images/button-approve-disabled.png');
    this.load.image('button-blue', '/images/button-blue.png');
    this.load.image('button-blue-pressed', '/images/button-blue-pressed.png');
    this.load.image('button-disabled', '/images/button-disabled.png');
    this.load.image('button-blue-med', '/images/button-blue-med.png');
    this.load.image('button-blue-med-pressed', '/images/button-blue-med-pressed.png');
    this.load.image('button-red-med', '/images/button-red-med.png');
    this.load.image('button-red-med-pressed', '/images/button-red-med-pressed.png');
    this.load.image('button-blue-long', '/images/button-blue-long.png');
    this.load.image('button-blue-long-pressed', '/images/button-blue-long-pressed.png');
    this.load.image('button-green-long', '/images/button-green-long.png');
    this.load.image('button-green-long-pressed', '/images/button-green-long-pressed.png');
    this.load.image('button-long-disabled', '/images/button-long-disabled.png');
    this.load.image('button-apply-disabled', '/images/button-apply-disabled.png');
    this.load.image('button-close', '/images/button-close.png');
    this.load.image('button-close-pressed', '/images/button-close-pressed.png');
    this.load.image('button-confirm', '/images/button-confirm.png');
    this.load.image('button-confirm-pressed', '/images/button-confirm-pressed.png');
    this.load.image('button-confirm-disabled', '/images/button-confirm-disabled.png');
    this.load.image('button-copy', '/images/button-copy.png');
    this.load.image('button-copy-pressed', '/images/button-copy-pressed.png');
    this.load.image('button-deposit', '/images/button-deposit.png');
    this.load.image('button-deposit-pressed', '/images/button-deposit-pressed.png');
    this.load.image('button-deposit-disabled', '/images/button-deposit-disabled.png');
    this.load.image('button-info', '/images/button-info.png');
    this.load.image('button-info-pressed', '/images/button-info-pressed.png');
    this.load.image('button-buy', '/images/button-buy.png');
    this.load.image('button-buy-pressed', '/images/button-buy-pressed.png');
    this.load.image('button-war', '/images/button-war.png');
    this.load.image('button-war-pressed', '/images/button-war-pressed.png');
    this.load.image('button-max', '/images/button-max.png');
    this.load.image('button-max-pressed', '/images/button-max-pressed.png');
    this.load.image('button-paste', '/images/button-paste.png');
    this.load.image('button-paste-pressed', '/images/button-paste-pressed.png');
    this.load.image('button-portfolio', '/images/button-portfolio.png');
    this.load.image('button-portfolio-pressed', '/images/button-portfolio-pressed.png');
    this.load.image('button-rank', '/images/button-rank.png');
    this.load.image('button-rank-pressed', '/images/button-rank-pressed.png');
    this.load.image('button-referral', '/images/button-referral.png');
    this.load.image('button-referral-pressed', '/images/button-referral-pressed.png');
    this.load.image('button-refresh', '/images/button-refresh.png');
    this.load.image('button-refresh-pressed', '/images/button-refresh-pressed.png');
    this.load.image('button-setting', '/images/button-setting.png');
    this.load.image('button-setting-pressed', '/images/button-setting-pressed.png');
    this.load.image('button-stake', '/images/button-stake.png');
    this.load.image('button-stake-pressed', '/images/button-stake-pressed.png');
    this.load.image('button-stake-disabled', '/images/button-stake-disabled.png');
    this.load.image('button-add', '/images/button-add.png');
    this.load.image('button-add-pressed', '/images/button-add-pressed.png');
    this.load.image('button-claim', '/images/button-claim.png');
    this.load.image('button-claim-pressed', '/images/button-claim-pressed.png');
    this.load.image('button-back-portfolio', '/images/button-back-portfolio.png');
    this.load.image('button-back-portfolio-pressed', '/images/button-back-portfolio-pressed.png');
    this.load.image('button-square', '/images/button-square.png');
    this.load.image('button-square-pressed', '/images/button-square-pressed.png');

    this.load.image('button-buy-safehouse', '/images/button-buy-safehouse.png');
    this.load.image('button-buy-safehouse-pressed', '/images/button-buy-safehouse-pressed.png');
    this.load.image('button-buy-gangster', '/images/button-buy-gangster.png');
    this.load.image('button-buy-gangster-pressed', '/images/button-buy-gangster-pressed.png');
    this.load.image('button-buy-goon', '/images/button-buy-goon.png');
    this.load.image('button-buy-goon-pressed', '/images/button-buy-goon-pressed.png');
    this.load.image('buy_plane_1', '/images/buy_plane_1.png');

    this.load.image('text-input', '/images/text-input.png');

    this.load.image('text-container', '/images/text-container.png');
    this.load.image('text-container-large', '/images/text-container-large.png');
    this.load.image('text-container-outlined', '/images/text-container-outlined.png');
    this.load.image('container-large', '/images/container-large.png');
    this.load.image('container-large-2', '/images/container-large-2.png');
    this.load.image('player-rank-container', '/images/player-rank-container.png');

    // settings
    this.load.image('settings-wallet-container', '/images/settings-wallet-container.png');
    this.load.image('view-transaction', '/images/texts/view-transaction.png');
    this.load.image('deposit-instruction', '/images/texts/deposit-instruction.png');
    this.load.image('deposit-link', '/images/texts/deposit-link.png');
    this.load.image('swap', '/images/swap.png');

    this.load.image('icon-chevron-right', '/images/icons/chevron-right.png');
    this.load.image('icon-clock', '/images/icons/clock.png');
    this.load.image('icon-coin', '/images/icons/coin.png');
    this.load.image('icon-coin-mini', '/images/icons/coin-mini.png');
    this.load.image('icon-coin-done', '/images/icons/coin-done.png');
    this.load.image('icon-coin-glowing', '/images/icons/coin-glowing.png');
    this.load.image('icon-crown-gold', '/images/icons/crown-gold.png');
    this.load.image('icon-crown-silver', '/images/icons/crown-silver.png');
    this.load.image('icon-crown-copper', '/images/icons/crown-copper.png');
    this.load.image('icon-eth', '/images/icons/eth.png');
    this.load.image('icon-eth-done', '/images/icons/eth-done.png');
    this.load.image('icon-gangster', '/images/icons/gangster.png');
    this.load.image('icon-gangster-mini', '/images/icons/gangster-mini.png');
    this.load.image('icon-gangster-buy-done', '/images/icons/gangster-buy-done.png');
    this.load.image('icon-gangster-buy-fail', '/images/icons/gangster-buy-fail.png');
    this.load.image('icon-goon-mini', '/images/icons/goon-mini.png');
    this.load.image('icon-goon-buy-done', '/images/icons/goon-buy-done.png');
    this.load.image('icon-goon-buy-fail', '/images/icons/goon-buy-fail.png');

    this.load.image('icon-info', '/images/icons/info.png');
    this.load.image('icon-loading', '/images/icons/loading.png');
    this.load.image('icon-logout', '/images/icons/logout.png');
    this.load.image('icon-nft-done', '/images/icons/nft-done.png');
    this.load.image('icon-open-link', '/images/icons/open-link.png');
    this.load.image('icon-safehouse-upgrade-done', '/images/icons/safehouse-upgrade-done.png');
    this.load.image('icon-safehouse-upgrade-fail', '/images/icons/safehouse-upgrade-fail.png');
    this.load.image('icon-settings', '/images/icons/settings.png');
    this.load.image('icon-sound-on', '/images/icons/sound-on.png');
    this.load.image('icon-sound-off', '/images/icons/sound-off.png');
    this.load.image('icon-star', '/images/icons/star.png');
    this.load.image('icon-wallet', '/images/icons/wallet.png');

    this.load.image('icon-history', '/images/icon-history.png');
    this.load.image('icon-war', '/images/icon-war.png');
    this.load.image('icon-checked', '/images/icon-checked.png');
    this.load.image('icon-unchecked', '/images/icon-unchecked.png');

    this.load.path = '/images/animation/';
    this.load.multiatlas('gangster-front', 'gangster_front.json');
    this.load.multiatlas('gangster-back', 'gangster_back.json');
    this.load.multiatlas('goon-front', 'goon_front.json');
    this.load.multiatlas('goon-back', 'goon_back.json');
  }

  create() {}

  update() {
    if (this.userInfoLoaded && this.assetLoaded) {
      this.game.events.emit('hide-bg');
      this.scene.start('MainScene');
    } else if (this.assetLoaded) {
      this.game.events.emit('check-user-loaded');
      if (this.loadingText) {
        this.loadingText.text = 'Loading profile...';
      }
    } else if (this.userInfoLoaded) {
      if (this.loadingText) {
        this.loadingText.text = 'Loading game assets...';
      }
    }
  }
}

export default LoadingScene;
