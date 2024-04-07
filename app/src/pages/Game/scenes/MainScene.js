import Phaser from 'phaser';

import configs from '../configs/configs';
import Background from '../components/common/Background';
import PopupWelcomeNoWar from '../components/popup/PopupWelcomeNoWar';
import PopupWelcomeWar from '../components/popup/PopupWelcomeWar';
import Header from '../components/action-buttons/Header';
import InfoButtons from '../components/action-buttons/InfoButtons';
import GangsterHouse from '../components/common/GangsterHouse';
import Footer from '../components/action-buttons/Footer';
import PopupBuy from '../components/popup/PopupBuy';
import PopupWar from '../components/popup/PopupWar';
import PopupSettings from '../components/popup/PopupSettings';
import PopupSwap from '../components/popup/PopupSwap';
import PopupWarHistory from '../components/popup/PopupWarHistory';
import PopupSafeHouseUpgrade from '../components/popup/PopupSafeHouseUpgrade';
import PopupBuyGoon from '../components/popup/PopupBuyGoon';
import PopupBuyGangster from '../components/popup/PopupBuyGangster';
import PopupPortfolio from '../components/popup/PopupPortfolio';
import Animation from '../components/common/Animation';
import PopupStatistic from '../components/popup/PopupStatistic';
import PopupLeaderboard from '../components/popup/PopupLeaderboard';
import PopupDeposit from '../components/popup/PopupDeposit';
import PopupDepositETH from '../components/popup/PopupDepositETH';
import PopupReferralProgram from '../components/popup/PopupReferralProgram';
import PopupPrizePool from '../components/popup/PopupPrizePool';
import PopupRetire from '../components/popup/PopupRetire';
import PopupWarMachines from '../components/popup/PopupWarMachines';
import PopupWarExplain from '../components/popup/PopupWarExplain';
import PopupWarAttack from '../components/popup/PopupWarAttack';
import PopupWarAttackConfirmation from '../components/popup/PopupWarAttackConfirmation';
import PopupWarAttackDetail from '../components/popup/PopupWarAttackDetail';
import PopupWarHistoryDetail from '../components/popup/PopupWarHistoryDetail';
import PopupGoonPrice from '../components/popup/PopupGoonPrice';
import PopupSafehousePrice from '../components/popup/PopupSafehousePrice';
import PopupDailySpin from '../components/popup/PopupDailySpin';
import PopupSpinReward from '../components/popup/PopupSpinReward';

const { goonAnimation, gangsterAnimation, width } = configs;

const gangsterBackAnimationSpeed = {
  x: Math.abs(gangsterAnimation.back.end.x - gangsterAnimation.back.start.x) / gangsterAnimation.back.time,
  y: Math.abs(gangsterAnimation.back.end.y - gangsterAnimation.back.start.y) / gangsterAnimation.back.time,
  scale: Math.abs(gangsterAnimation.back.end.scale - gangsterAnimation.back.start.scale) / gangsterAnimation.back.time,
};

const gangsterFrontAnimationSpeed = {
  x: Math.abs(gangsterAnimation.front.end.x - gangsterAnimation.front.start.x) / gangsterAnimation.front.time,
  y: Math.abs(gangsterAnimation.front.end.y - gangsterAnimation.front.start.y) / gangsterAnimation.front.time,
  scale:
    Math.abs(gangsterAnimation.front.end.scale - gangsterAnimation.front.start.scale) / gangsterAnimation.front.time,
};

const goonBackAnimationSpeed = {
  x: Math.abs(goonAnimation.back.end.x - goonAnimation.back.start.x) / goonAnimation.back.time,
  y: Math.abs(goonAnimation.back.end.y - goonAnimation.back.start.y) / goonAnimation.back.time,
  scale: Math.abs(goonAnimation.back.end.scale - goonAnimation.back.start.scale) / goonAnimation.back.time,
};

const goonFrontAnimationSpeed = {
  x: Math.abs(goonAnimation.front.end.x - goonAnimation.front.start.x) / goonAnimation.front.time,
  y: Math.abs(goonAnimation.front.end.y - goonAnimation.front.start.y) / goonAnimation.front.time,
  scale: Math.abs(goonAnimation.front.end.scale - goonAnimation.front.start.scale) / goonAnimation.front.time,
};

class MainScene extends Phaser.Scene {
  isGameEnded = false;
  isUserActive = false;
  isFromTutorial = false;
  isSpinning = false;
  timeout = null;

  constructor() {
    super('MainScene');
  }

  init(data) {
    const { isFromTutorial } = data;
    this.isFromTutorial = isFromTutorial;
  }

  requestClaimableReward() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(() => {
      this.game.events.emit('request-claimable-reward');
    }, 200);
  }

  preload() {
    this.load.script('chartjs', 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.8.0/chart.min.js');

    this.bgMusic = this.sound.add('bg', { loop: true, volume: 0.15 });

    this.background = new Background(this, 'bg');
    this.add.existing(this.background);

    this.animationLayer = new Animation(this);
    this.add.existing(this.animationLayer);

    const gangsterHouse = new GangsterHouse(this, 2200);
    this.add.existing(gangsterHouse);

    this.popupDepositETH = new PopupDepositETH(this);
    this.add.existing(this.popupDepositETH);

    this.popupDeposit = new PopupDeposit(this);
    this.add.existing(this.popupDeposit);

    this.popupBuy = new PopupBuy(this, width - 335, 1600);
    this.add.existing(this.popupBuy);

    const header = new Header(this, 250);
    this.add.existing(header);

    this.popupWar = new PopupWar(this, 35, 1850);
    this.add.existing(this.popupWar);

    this.popupSettings = new PopupSettings(this);
    this.add.existing(this.popupSettings);

    this.popupSwap = new PopupSwap(this, this.popupSettings);
    this.add.existing(this.popupSwap);

    this.popupReferralProgram = new PopupReferralProgram(this);
    this.add.existing(this.popupReferralProgram);

    this.popupPortfolio = new PopupPortfolio(this);
    this.add.existing(this.popupPortfolio);

    this.popupStatistic = new PopupStatistic(this);
    this.add.existing(this.popupStatistic);

    this.popupWarAttackConfirmation = new PopupWarAttackConfirmation(this);
    this.add.existing(this.popupWarAttackConfirmation);

    this.popupWarAttackDetail = new PopupWarAttackDetail(this);
    this.add.existing(this.popupWarAttackDetail);

    this.popupWarHistoryDetail = new PopupWarHistoryDetail(this);
    this.add.existing(this.popupWarHistoryDetail);

    this.game.events.on('music-on', () => {
      this.bgMusic.play();
    });

    this.game.events.on('music-off', () => {
      this.bgMusic.stop();
    });

    this.game.events.on('update-workers-machines', ({ numberOfWorkers, numberOfMachines }) => {
      this.game.events.emit('update-gangster-animation', { numberOfMachines });
      this.game.events.emit('update-goon-animation', { numberOfWorkers });
    });

    this.game.events.emit('request-workers-machines');
    if (this.game.sound.mute) {
      this.bgMusic.stop();
    } else {
      this.bgMusic.play();
    }

    const pluginLoader = this.load.scenePlugin({
      key: 'rexuiplugin',
      url: '/libs/rexui.min.js',
      sceneKey: 'rexUI',
    });
    pluginLoader.once(Phaser.Loader.Events.COMPLETE, () => {
      this.popupSafeHouseUpgrade = new PopupSafeHouseUpgrade(this);
      this.add.existing(this.popupSafeHouseUpgrade);

      this.popupBuyGoon = new PopupBuyGoon(this);
      this.add.existing(this.popupBuyGoon);

      this.popupBuyGangster = new PopupBuyGangster(this);
      this.add.existing(this.popupBuyGangster);

      this.popupGoonPrice = new PopupGoonPrice(this);
      this.add.existing(this.popupGoonPrice);

      this.popupSafehousePrice = new PopupSafehousePrice(this);
      this.add.existing(this.popupSafehousePrice);

      this.popupLeaderboard = new PopupLeaderboard(this);
      this.add.existing(this.popupLeaderboard);

      this.popupPrizePool = new PopupPrizePool(this);
      this.add.existing(this.popupPrizePool);

      this.popupRetire = new PopupRetire(this);
      this.add.existing(this.popupRetire);

      this.popupWarHistory = new PopupWarHistory(this);
      this.add.existing(this.popupWarHistory);

      this.popupWarExplain = new PopupWarExplain(this);
      this.add.existing(this.popupWarExplain);

      this.popupWarMachines = new PopupWarMachines(this);
      this.add.existing(this.popupWarMachines);

      this.popupWarAttack = new PopupWarAttack(this);
      this.add.existing(this.popupWarAttack);

      this.popupDailySpin = new PopupDailySpin(this);
      this.add.existing(this.popupDailySpin);

      const footer = new Footer(this, 2600);
      footer.setDepth(1);
      this.add.existing(footer);
    });

    this.popupSpinReward = new PopupSpinReward(this);
    this.popupSpinReward.setDepth(2);
    this.add.existing(this.popupSpinReward);

    this.infoButtons = new InfoButtons(this, 550);
    this.add.existing(this.infoButtons);
    this.game.events.on('update-user-away-reward', ({ showWarPopup, claimableReward }) => {
      this.popupWelcome = showWarPopup
        ? new PopupWelcomeWar(this, claimableReward)
        : new PopupWelcomeNoWar(this, claimableReward);
      this.add.existing(this.popupWelcome);
    });
    this.game.events.on('game-ended', () => {
      console.log('trigger game end');
      this.isGameEnded = true;
    });
    this.game.events.on('update-active-status', ({ active }) => {
      this.isUserActive = active;
    });

    this.game.events.on('update-spinned-status', ({ spinned }) => {
      this.infoButtons?.spinButton?.setVisible(!spinned);
    });
    this.game.events.emit('request-game-ended-status');
    this.game.events.emit('request-active-status');
    this.game.events.emit('request-deposit-code');
    if (!this.isFromTutorial) {
      this.game.events.emit('request-user-away-reward');
    }
  }

  create() {
    this.spinListener();
  }

  spinListener() {
    this.game.events.on('start-spin', () => {
      if (this.isSpinning) return;
      this.isSpinning = true;
      this.game.events.emit('daily-spin');
    });

    this.game.events.on('stop-spin', (reward) => {
      this.isSpinning = false;
      if (reward) {
        setTimeout(() => {
          this.popupDailySpin && (this.popupDailySpin.loading = false);
          this.popupDailySpin?.close();
          this.popupSpinReward?.showReward(reward);
        }, 1500);
      }
    });
  }

  updateAnimationPositions(delta) {
    if (this.animationLayer.gangsterAction === 'back') {
      const { x, y } = this.animationLayer.gangsterBack;
      if (x >= gangsterAnimation.back.end.x || y <= gangsterAnimation.back.end.y) {
        this.game.events.emit('animation-gangster-front');
      } else {
        const newX = Math.min(
          this.animationLayer.gangsterBack.x + gangsterBackAnimationSpeed.x * delta,
          gangsterAnimation.back.end.x
        );
        const newY = Math.max(
          this.animationLayer.gangsterBack.y - gangsterBackAnimationSpeed.y * delta,
          gangsterAnimation.back.end.y
        );
        const newScale = Math.max(
          this.animationLayer.gangsterBack.scale - gangsterBackAnimationSpeed.scale * delta,
          gangsterAnimation.back.end.scale
        );
        this.animationLayer.gangsterBack.x = newX;
        this.animationLayer.gangsterBack.y = newY;
        this.animationLayer.gangsterBack.setScale(newScale);
        this.animationLayer.updateGangsterCounter(newX, newY - newScale * 500);
      }
    }

    if (this.animationLayer.gangsterAction === 'front') {
      const { y } = this.animationLayer.gangsterFront;
      if (y >= gangsterAnimation.front.end.y) {
        this.game.events.emit('animation-gangster-back');
        // this.game.events.emit('request-claimable-reward');
        this.game.events.emit('check-game-ended');
        this.requestClaimableReward();
      } else {
        const newY = Math.min(
          this.animationLayer.gangsterFront.y + gangsterFrontAnimationSpeed.y * delta,
          gangsterAnimation.front.end.y
        );
        const newScale = Math.min(
          this.animationLayer.gangsterFront.scale + gangsterFrontAnimationSpeed.scale * delta,
          gangsterAnimation.front.end.scale
        );
        this.animationLayer.gangsterFront.y = newY;
        this.animationLayer.gangsterFront.setScale(newScale);
        this.animationLayer.updateGangsterCounter(this.animationLayer.gangsterFront.x, newY - newScale * 500);
      }
    }

    if (this.animationLayer.goonAction === 'back') {
      const { x, y } = this.animationLayer.goonBack;

      if (x <= goonAnimation.back.end.x || y <= goonAnimation.back.end.y) {
        this.game.events.emit('animation-goon-front');
      } else {
        const newX = Math.max(
          this.animationLayer.goonBack.x - goonBackAnimationSpeed.x * delta,
          goonAnimation.back.end.x
        );
        const newY = Math.max(
          this.animationLayer.goonBack.y - goonBackAnimationSpeed.y * delta,
          goonAnimation.back.end.y
        );
        const newScale = Math.max(
          this.animationLayer.goonBack.scale - goonBackAnimationSpeed.scale * delta,
          goonAnimation.back.end.scale
        );
        this.animationLayer.goonBack.x = newX;
        this.animationLayer.goonBack.y = newY;
        this.animationLayer.goonBack.setScale(newScale);
        this.animationLayer.updateGoonCounter(newX, newY - newScale * 600);
      }
    }

    if (this.animationLayer.goonAction === 'front') {
      const { y } = this.animationLayer.goonFront;

      if (y >= goonAnimation.front.end.y) {
        this.game.events.emit('animation-goon-back');
        this.game.events.emit('check-game-ended');
        // only update claimable when gangsters return to safehouse
        // -> uncomment if gangster & goon's running are no longer synchronized
        // this.game.events.emit('request-claimable-reward');
        this.requestClaimableReward();
      } else {
        const newY = Math.min(
          this.animationLayer.goonFront.y + goonFrontAnimationSpeed.y * delta,
          goonAnimation.front.end.y
        );
        const newScale = Math.min(
          this.animationLayer.goonFront.scale + goonFrontAnimationSpeed.scale * delta,
          goonAnimation.front.end.scale
        );
        this.animationLayer.goonFront.y = newY;
        this.animationLayer.goonFront.setScale(newScale);
        this.animationLayer.updateGoonCounter(this.animationLayer.goonFront.x, newY - newScale * 600);
      }
    }
  }

  updateSpin() {
    if (!this.isSpinning) return;
    this.game.events.emit('continue-spin');
  }

  update(_time, delta) {
    this.updateAnimationPositions(delta);
    this.updateSpin();
  }
}

export default MainScene;
