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
import PopupDailyGangWar from '../components/popup/PopupDailyGangWar';
import PopupWarHistory from '../components/popup/PopupWarHistory';
import PopupSafeHouseUpgrade from '../components/popup/PopupSafeHouseUpgrade';
import PopupBuyGoon from '../components/popup/PopupBuyGoon';
import PopupBuyGangster from '../components/popup/PopupBuyGangster';
import PopupPortfolio from '../components/popup/PopupPortfolio';
import Animation from '../components/common/Animation';
import PopupStatistic from '../components/popup/PopupStatistic';
import PopupLeaderboard from '../components/popup/PopupLeaderboard';
import PopupDeposit from '../components/popup/PopupDeposit';
import PopupReferralProgram from '../components/popup/PopupReferralProgram';
import PopupPrizePool from '../components/popup/PopupPrizePool';
import PopupRetire from '../components/popup/PopupRetire';
import PopupWarMachines from '../components/popup/PopupWarMachines';
import PopupWarExplain from '../components/popup/PopupWarExplain';

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

  constructor() {
    super('MainScene');
  }

  preload() {
    this.bgMusic = this.sound.add('bg', { loop: true, volume: 0.15 });

    this.background = new Background(this, 'bg');
    this.add.existing(this.background);

    this.animationLayer = new Animation(this);
    this.add.existing(this.animationLayer);

    const gangsterHouse = new GangsterHouse(this, 2200);
    this.add.existing(gangsterHouse);

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

    this.popupReferralProgram = new PopupReferralProgram(this);
    this.add.existing(this.popupReferralProgram);

    this.popupPortfolio = new PopupPortfolio(this);
    this.add.existing(this.popupPortfolio);

    this.popupStatistic = new PopupStatistic(this);
    this.add.existing(this.popupStatistic);

    this.popupDailyGangWar = new PopupDailyGangWar(this);
    this.add.existing(this.popupDailyGangWar);

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

      const footer = new Footer(this, 2600);
      footer.setDepth(1);
      this.add.existing(footer);
    });

    const infoButtons = new InfoButtons(this, 550);
    this.add.existing(infoButtons);
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
    this.game.events.emit('request-game-ended-status');
    this.game.events.emit('request-user-away-reward');
  }

  create() {}

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
        this.game.events.emit('request-claimable-reward');
        this.game.events.emit('check-game-ended');
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

  update(_time, delta) {
    this.updateAnimationPositions(delta);
  }
}

export default MainScene;
