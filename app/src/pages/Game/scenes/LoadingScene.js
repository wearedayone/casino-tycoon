import Phaser from 'phaser';

import configs from '../configs/configs';

const logoRatio = 10 / 3;
const loadingIconRatio = 100 / 109;
const isXS = window.innerWidth < 600;
const logoWidth = isXS ? window.innerWidth - 32 : Math.min(600, window.innerWidth - 32);
const logoHeight = logoWidth / logoRatio;
const loadingIconWidth = 100;
const loadingIconHeight = loadingIconWidth / loadingIconRatio;

export const windowLoadingTextY = 0.2 * window.innerHeight + logoHeight + 16 + loadingIconHeight + 32;

class LoadingScene extends Phaser.Scene {
  assetLoaded = false;
  userInfoLoaded = false;
  loadingPercent = 0;

  constructor() {
    super('LoadingScene');
  }

  preload() {
    this.game.events.on('update-user-completed-tutorial', ({ completed }) => {
      this.game.events.emit('hide-bg');
      this.scene.start(completed ? 'MainScene' : 'TutorialScene');
    });

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
    this.loadingText = this.make.text({
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
    this.loadingText.setOrigin(0.5, 0);
    this.loadingText.setStroke('#000000', 6);

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

    // sounds
    this.load.audio('bg', '/audios/bg.mp3');
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
    this.load.audio('spin-sound', '/audios/spin-sound.wav');
    this.load.audio('spin-result-sound', '/audios/spin-result-sound.wav');

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

    this.load.image('xgang-balance', '/images/xgang-balance.png');
    this.load.image('fiat-balance', '/images/fiat-balance.png');
    this.load.image('eth-balance', '/images/eth-balance.png');

    this.load.image('popup', '/images/popup.png');
    this.load.image('popup-tiny', '/images/popup-tiny.png');
    this.load.image('popup-mini', '/images/popup-mini.png');
    this.load.image('popup-small', '/images/popup-small.png');
    this.load.image('popup-medium', '/images/popup-medium.png');
    this.load.image('popup-large', '/images/popup-large.png');
    this.load.image('popup-extra-large', '/images/popup-extra-large.png');
    this.load.image('popup-title', '/images/popup-title.png');
    this.load.image('popup-title-large', '/images/popup-title-large.png');
    this.load.image('popup-welcome-war', '/images/popup-welcome-war.png');
    this.load.image('popup-welcome-nowar', '/images/popup-welcome-nowar.png');
    this.load.image('popup-war', '/images/popup-war.png');
    this.load.image('popup-safehouse-upgrade', '/images/popup-safehouse-upgrade.png');
    this.load.image('popup-buy-goon', '/images/popup-buy-goon.png');
    this.load.image('popup-buy-gangster', '/images/popup-buy-gangster.png');
    this.load.image('popup-hold', '/images/popup-hold.png');
    this.load.image('popup-portfolio-with-reputation', '/images/popup-portfolio-with-reputation.png');
    this.load.image('popup-statistic', '/images/popup-statistic.png');
    this.load.image('popup-referral', '/images/popup-referral.png');
    this.load.image('popup-war-machines', '/images/popup-war-machines.png');
    this.load.image('popup-gang-war-explain', '/images/popup-gang-war-explain.png');
    this.load.image('popup-war-attack', '/images/popup-war-attack.png');
    this.load.image('popup-war-attack-confirmation', '/images/popup-attack-confirmation.png');
    this.load.image('popup-war-attack-detail', '/images/popup-war-attack-detail.png');
    this.load.image('popup-war-history', '/images/popup-war-history.png');
    this.load.image('popup-house-price', '/images/popup-house-price.png');
    this.load.image('popup-goon-price', '/images/popup-goon-price.png');
    this.load.image('popup-spin', '/images/popup-spin.png');
    this.load.image('popup-swap', '/images/popup-swap.png');
    this.load.image('popup-warning-limit-gangster', '/images/popup-warning-limit-gangster.png');

    this.load.image('ribbon-welcome', '/images/ribbon-welcome.png');
    this.load.image('quantity-plane', '/images/quantity-plane.png');

    this.load.image('glow', '/images/glow.png');
    this.load.image('coin', '/images/coin.png');
    this.load.image('guard', '/images/guard.png');
    this.load.image('mini-gangster-2', '/images/mini-gangster-2.png');
    this.load.image('percent', '/images/percent.png');
    this.load.image('gun', '/images/gun.png');
    this.load.image('man', '/images/man.png');
    this.load.image('eth-coin', '/images/eth-coin.png');
    this.load.image('counter', '/images/counter.png');
    this.load.image('row-container', '/images/row-container.png');
    this.load.image('goon-mini', '/images/goon-mini.png');
    this.load.image('safehouse-mini', '/images/safehouse-mini.png');
    this.load.image('swap-arrow', '/images/swap-arrow.png');
    this.load.image('arrow-spin-down', '/images/arrow-spin-down.png');
    this.load.image('arrow-spin-up', '/images/arrow-spin-up.png');
    this.load.image('arrow-1-white', '/images/arrow-1-white.png');
    this.load.image('arrow-1-blue', '/images/arrow-1-blue.png');
    this.load.image('arrow-2-white', '/images/arrow-2-white.png');
    this.load.image('arrow-2-blue', '/images/arrow-2-blue.png');
    this.load.image('spin-item', '/images/spin-item.png');
    this.load.image('spin-item-active', '/images/spin-item-active.png');
    this.load.image('spin-house', '/images/spin-house.png');
    this.load.image('spin-point', '/images/spin-point.png');
    this.load.image('spin-reward-house', '/images/spin-reward-house.png');
    this.load.image('spin-reward-point', '/images/spin-reward-point.png');
    this.load.image('spin-reward-glow-fx', '/images/spin-reward-glow-fx.png');
    this.load.image('swap-switch-container', '/images/swap-switch-container.png');
    this.load.image('gang-coin', '/images/gang-coin.png');
    this.load.image('gang-coin-small', '/images/gang-coin-small.png');

    this.load.image('button-blue', '/images/button-blue.png');
    this.load.image('button-blue-pressed', '/images/button-blue-pressed.png');
    this.load.image('button-disabled', '/images/button-disabled.png');
    this.load.image('button-blue-mini', '/images/button-blue-mini.png');
    this.load.image('button-blue-mini-pressed', '/images/button-blue-mini-pressed.png');
    this.load.image('button-blue-med', '/images/button-blue-med.png');
    this.load.image('button-blue-med-pressed', '/images/button-blue-med-pressed.png');
    this.load.image('button-blue-med-outlined', '/images/button-blue-med-outlined.png');
    this.load.image('button-red-med', '/images/button-red-med.png');
    this.load.image('button-red-med-pressed', '/images/button-red-med-pressed.png');
    this.load.image('button-blue-long', '/images/button-blue-long.png');
    this.load.image('button-blue-long-pressed', '/images/button-blue-long-pressed.png');
    this.load.image('button-blue-long-thick', '/images/button-blue-long-thick.png');
    this.load.image('button-blue-long-thick-pressed', '/images/button-blue-long-thick-pressed.png');
    this.load.image('button-green-long', '/images/button-green-long.png');
    this.load.image('button-green-long-pressed', '/images/button-green-long-pressed.png');
    this.load.image('button-long-disabled', '/images/button-long-disabled.png');
    this.load.image('button-check', '/images/button-check.png');
    this.load.image('button-check-pressed', '/images/button-check-pressed.png');
    this.load.image('button-close', '/images/button-close.png');
    this.load.image('button-close-pressed', '/images/button-close-pressed.png');
    this.load.image('button-copy', '/images/button-copy.png');
    this.load.image('button-copy-pressed', '/images/button-copy-pressed.png');
    this.load.image('button-deposit', '/images/button-deposit.png');
    this.load.image('button-deposit-pressed', '/images/button-deposit-pressed.png');
    this.load.image('button-deposit-disabled', '/images/button-deposit-disabled.png');
    this.load.image('button-hold', '/images/button-hold.png');
    this.load.image('button-hold-pressed', '/images/button-hold-pressed.png');
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
    this.load.image('button-paste-small', '/images/button-paste-small.png');
    this.load.image('button-paste-small-pressed', '/images/button-paste-small-pressed.png');
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
    this.load.image('button-twitter', '/images/button-twitter.png');
    this.load.image('button-twitter-pressed', '/images/button-twitter-pressed.png');
    this.load.image('button-add', '/images/button-add.png');
    this.load.image('button-add-pressed', '/images/button-add-pressed.png');
    this.load.image('button-claim', '/images/button-claim.png');
    this.load.image('button-claim-pressed', '/images/button-claim-pressed.png');
    this.load.image('button-back-portfolio', '/images/button-back-portfolio.png');
    this.load.image('button-back-portfolio-pressed', '/images/button-back-portfolio-pressed.png');
    this.load.image('button-square', '/images/button-square.png');
    this.load.image('button-square-pressed', '/images/button-square-pressed.png');
    this.load.image('button-square-disabled', '/images/button-square-disabled.png');
    this.load.image('button-green', '/images/button-green.png');
    this.load.image('button-green-pressed', '/images/button-green-pressed.png');
    this.load.image('button-blue-small', '/images/button-blue-small.png');
    this.load.image('button-square-small', '/images/button-square-small.png');
    this.load.image('button-square-small-pressed', '/images/button-square-small-pressed.png');
    this.load.image('button-square-tiny', '/images/button-square-tiny.png');
    this.load.image('button-square-tiny-pressed', '/images/button-square-tiny-pressed.png');
    this.load.image('button-spin', '/images/button-spin.png');
    this.load.image('button-spin-pressed', '/images/button-spin-pressed.png');
    this.load.image('button-spin-claim', '/images/button-spin-claim.png');
    this.load.image('button-spin-claim-pressed', '/images/button-spin-claim-pressed.png');
    this.load.image('button-spin-disabled', '/images/button-spin-disabled.png');
    this.load.image('button-reward', '/images/button-reward.png');
    this.load.image('button-reward-pressed', '/images/button-reward-pressed.png');
    this.load.image('button-daily-spin', '/images/button-daily-spin.png');
    this.load.image('button-daily-spin-pressed', '/images/button-daily-spin-pressed.png');
    this.load.image('button-green-full-length', '/images/button-green-full-length.png');
    this.load.image('button-green-full-length-pressed', '/images/button-green-full-length-pressed.png');
    this.load.image('button-green-full-length-disabled', '/images/button-green-full-length-disabled.png');

    this.load.image('button-buy-safehouse', '/images/button-buy-safehouse.png');
    this.load.image('button-buy-safehouse-pressed', '/images/button-buy-safehouse-pressed.png');
    this.load.image('button-buy-gangster', '/images/button-buy-gangster.png');
    this.load.image('button-buy-gangster-pressed', '/images/button-buy-gangster-pressed.png');
    this.load.image('button-buy-goon', '/images/button-buy-goon.png');
    this.load.image('button-buy-goon-pressed', '/images/button-buy-goon-pressed.png');
    this.load.image('buy_plane_1', '/images/buy_plane_1.png');

    this.load.image('text-input', '/images/text-input.png');
    this.load.image('text-input-small', '/images/text-input-small.png');
    this.load.image('search-input', '/images/search-input.png');
    this.load.image('pagination', '/images/pagination.png');
    this.load.image('pagination-active', '/images/pagination-active.png');
    this.load.image('pagination-disabled', '/images/pagination-disabled.png');
    this.load.image('deploy-now', '/images/deploy-now.png');
    this.load.image('tooltip-next-war', '/images/tooltip-next-war.png');
    this.load.image('badge', '/images/badge.png');
    this.load.image('arrow-down-gold', '/images/arrow-down-gold.png');
    this.load.image('arrow-up-gold', '/images/arrow-up-gold.png');

    this.load.image('text-container', '/images/text-container.png');
    this.load.image('text-container-outlined', '/images/text-container-outlined.png');
    this.load.image('tabs-container', '/images/tabs-container.png');
    this.load.image('tabs-container-simple', '/images/tabs-container-simple.png');
    this.load.image('container-short', '/images/container-short.png');
    this.load.image('container-large', '/images/container-large.png');
    this.load.image('container-large-2', '/images/container-large-2.png');
    this.load.image('container-large-3', '/images/container-large-3.png');
    this.load.image('container-small', '/images/container-small.png');
    this.load.image('container-super-large', '/images/container-super-large.png');
    this.load.image('container-border', '/images/container-border.png');
    this.load.image('container-border-top', '/images/container-border-top.png');
    this.load.image('container-border-middle', '/images/container-border-middle.png');
    this.load.image('container-border-bottom', '/images/container-border-bottom.png');
    this.load.image('container-price', '/images/container-price.png');
    this.load.image('player-rank-container', '/images/player-rank-container.png');
    this.load.image('price-chart-title-container', '/images/price-chart-title-container.png');
    this.load.image('price-chart-frame', '/images/price-chart-frame.png');
    this.load.image('swap-eth-token', '/images/swap-eth-token.png');
    this.load.image('swap-token-eth', '/images/swap-token-eth.png');
    this.load.image('swap-xgang-gang', '/images/swap-xgang-gang.png');
    let path = this.load.path;
    this.load.path = '/images/animation/';
    this.load.multiatlas('gangster-front', 'gangster_front.json');
    this.load.multiatlas('gangster-back', 'gangster_back.json');
    this.load.multiatlas('goon-front', 'goon_front.json');
    this.load.multiatlas('goon-back', 'goon_back.json');
    this.load.path = path;
    // settings
    this.load.image('settings-wallet-container', '/images/settings-wallet-container.png');
    this.load.image('view-transaction', '/images/texts/view-transaction.png');
    this.load.image('swap', '/images/swap.png');

    this.load.image('icon-chevron-right', '/images/icons/chevron-right.png');
    this.load.image('icon-check', '/images/icons/check.png');
    this.load.image('icon-checkbox-true', '/images/icons/checkbox-true.png');
    this.load.image('icon-checkbox-false', '/images/icons/checkbox-false.png');
    this.load.image('icon-clock', '/images/icons/clock.png');
    this.load.image('icon-coin', '/images/icons/coin.png');
    this.load.image('icon-coin-small', '/images/icons/coin-small.png');
    this.load.image('icon-coin-mini', '/images/icons/coin-mini.png');
    this.load.image('icon-coin-done', '/images/icons/coin-done.png');
    this.load.image('icon-coin-glowing', '/images/icons/coin-glowing.png');
    this.load.image('icon-coin-outlined-small', '/images/icons/coin-outlined-small.png');
    this.load.image('icon-crown-gold', '/images/icons/crown-gold.png');
    this.load.image('icon-crown-silver', '/images/icons/crown-silver.png');
    this.load.image('icon-crown-copper', '/images/icons/crown-copper.png');
    this.load.image('icon-eth', '/images/icons/eth.png');
    this.load.image('icon-eth-small', '/images/icons/eth-small.png');
    this.load.image('icon-eth-done', '/images/icons/eth-done.png');
    this.load.image('icon-gangster', '/images/icons/gangster.png');
    this.load.image('icon-gangster-medium', '/images/icons/gangster-medium.png');
    this.load.image('icon-gangster-small', '/images/icons/gangster-small.png');
    this.load.image('icon-gangster-mini', '/images/icons/gangster-mini.png');
    this.load.image('icon-gangster-buy-done', '/images/icons/gangster-buy-done.png');
    this.load.image('icon-gangster-buy-fail', '/images/icons/gangster-buy-fail.png');
    this.load.image('icon-goon-medium', '/images/icons/goon-medium.png');
    this.load.image('icon-goon-mini', '/images/icons/goon-mini.png');
    this.load.image('icon-goon-buy-done', '/images/icons/goon-buy-done.png');
    this.load.image('icon-goon-buy-fail', '/images/icons/goon-buy-fail.png');
    this.load.image('icon-info', '/images/icons/info.png');
    this.load.image('icon-loading', '/images/icons/loading.png');
    this.load.image('icon-logout', '/images/icons/logout.png');
    this.load.image('icon-nft-done', '/images/icons/nft-done.png');
    this.load.image('icon-open-link', '/images/icons/open-link.png');
    this.load.image('icon-retire-done', '/images/icons/retire-done.png');
    this.load.image('icon-retire-fail', '/images/icons/retire-fail.png');
    this.load.image('icon-ribbon-chart', '/images/icons/ribbon-chart.png');
    this.load.image('icon-safehouse-medium', '/images/icons/safehouse-medium.png');
    this.load.image('icon-safehouse-upgrade-done', '/images/icons/safehouse-upgrade-done.png');
    this.load.image('icon-safehouse-upgrade-fail', '/images/icons/safehouse-upgrade-fail.png');
    this.load.image('icon-search-contained', '/images/icons/search-contained.png');
    this.load.image('icon-settings', '/images/icons/settings.png');
    this.load.image('icon-sound-on', '/images/icons/sound-on.png');
    this.load.image('icon-sound-off', '/images/icons/sound-off.png');
    this.load.image('icon-star', '/images/icons/star.png');
    this.load.image('icon-star-medium', '/images/icons/star-medium.png');
    this.load.image('icon-wallet', '/images/icons/wallet.png');
    this.load.image('icon-search', '/images/icon-search.png');
    this.load.image('icon-xgang-small', '/images/icons/xgang-small.png');
    this.load.image('icon-xgang', '/images/icon-xgang.png');
    this.load.image('icon-safehouse-upgraded-level', '/images/icon-safehouse-upgraded-level.png');

    this.load.image('icon-history', '/images/icon-history.png');
    this.load.image('icon-war', '/images/icon-war.png');
    this.load.image('icon-error-network', '/images/icons/error-network.png');
    this.load.image('icon-error-unknown', '/images/icons/error-unknown.png');
    this.load.image('icon-error-insufficient', '/images/icons/error-insufficient.png');
    this.load.image('deposit-more-eth', '/images/deposit-more-eth.png');

    this.load.image('tutorial-overlay', '/images/tutorial-overlay.png');
    this.load.image('tutorial-arrow-up', '/images/tutorial-arrow-up.png');
    this.load.image('tutorial-arrow-down', '/images/tutorial-arrow-down.png');
    this.load.image('tutorial-arrow-left', '/images/tutorial-arrow-left.png');
    this.load.image('tutorial-arrow-right', '/images/tutorial-arrow-right.png');
    this.load.image('tutorial-claim-inactive-btn', '/images/tutorial-claim-inactive-btn.png');
    this.load.image('tutorial-1', '/images/tutorial-1.png');
    this.load.image('tutorial-2', '/images/tutorial-2.png');
    this.load.image('tutorial-4', '/images/tutorial-4.png');
    this.load.image('tutorial-4-gangster', '/images/tutorial-4-gangster.png');
    this.load.image('tutorial-4-claim-btn', '/images/tutorial-4-claim-btn.png');
    this.load.image('tutorial-4-claim-btn-light', '/images/tutorial-4-claim-btn-light.png');
    this.load.image('tutorial-5', '/images/tutorial-5.png');
    this.load.image('tutorial-7', '/images/tutorial-7.png');
    this.load.image('tutorial-9', '/images/tutorial-9.png');
    this.load.image('tutorial-11', '/images/tutorial-11.png');
    this.load.image('tutorial-13', '/images/tutorial-13.png');
    this.load.image('tutorial-15', '/images/tutorial-15.png');
    this.load.image('tutorial-15-goon', '/images/tutorial-15-goon.png');
    this.load.image('tutorial-16', '/images/tutorial-16.png');
  }

  create() {}

  update() {
    if (this.userInfoLoaded && this.assetLoaded) {
      this.game.events.emit('check-user-completed-tutorial');
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
