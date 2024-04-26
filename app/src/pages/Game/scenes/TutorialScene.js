import Phaser from 'phaser';

import configs from '../configs/configs';
import Background from '../components/common/Background';
import Header from '../components/action-buttons/Header';
import InfoButtons from '../components/action-buttons/InfoButtons';
import GangsterHouse from '../components/common/GangsterHouse';
import Footer from '../components/action-buttons/Footer';
import PopupBuy from '../components/popup/PopupBuy';
import PopupWar from '../components/popup/PopupWar';
import PopupWarMachines from '../components/popup/PopupWarMachines';
import PopupWarExplain from '../components/popup/PopupWarExplain';
import PopupSafeHouseUpgrade from '../components/popup/PopupSafeHouseUpgrade';
import PopupBuyGoon from '../components/popup/PopupBuyGoon';
import PopupBuyGangster from '../components/popup/PopupBuyGangster';
import Animation from '../components/common/Animation';
import PopupReferralProgram from '../components/popup/PopupReferralProgram';
import PopupLeaderboard from '../components/popup/PopupLeaderboard';
import PopupDeposit from '../components/popup/PopupDeposit';
import PopupPrizePool from '../components/popup/PopupPrizePool';
import Tutorial from '../components/tutorials/Tutorial';
import PopupDepositETH from '../components/popup/PopupDepositETH';

const { goonAnimation, gangsterAnimation, width, height } = configs;

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

class TutorialScene extends Phaser.Scene {
  isGameEnded = false;

  constructor() {
    super('TutorialScene');
  }

  preload() {
    this.bgMusic = this.sound.add('bg', { loop: true, volume: 0.15 });

    this.background = new Background(this, 'bg'); // done
    this.add.existing(this.background);

    this.animationLayer = new Animation(this, { isSimulator: true }); // done
    this.add.existing(this.animationLayer);

    const gangsterHouse = new GangsterHouse(this, 2200, { isSimulator: true }); // done
    this.add.existing(gangsterHouse);

    const endTutorial = () => {
      this.game.events.emit('simulator-end');
      this.scene.stop();
      this.scene.start('MainScene', { isFromTutorial: true });
    };

    this.popupReferralProgram = new PopupReferralProgram(this, {
      noBackground: true,
      originY: -120,
      onOpen: () => {
        this.tutorial.step13.setVisible(false);
        this.tutorial.step14.setVisible(true);
      },
    });
    this.add.existing(this.popupReferralProgram);

    this.popupDeposit = new PopupDeposit(this, null, {
      isSimulator: true,
      onOpen: () => {
        this.tutorial.step16.setVisible(false);
      },
      onClose: endTutorial,
    }); // done
    this.add.existing(this.popupDeposit);

    this.popupDepositETH = new PopupDepositETH(this, { isSimulator: true, onClose: endTutorial });
    this.add.existing(this.popupDepositETH);

    this.popupBuy = new PopupBuy(this, width - 335, 1600); // done
    this.add.existing(this.popupBuy);

    const header = new Header(this, 250, { isSimulator: true }); // done
    this.add.existing(header);

    this.popupWar = new PopupWar(this, 35, 1850); // done
    this.add.existing(this.popupWar);

    this.game.events.on('music-on', () => {
      this.bgMusic.play();
    });

    this.game.events.on('music-off', () => {
      this.bgMusic.stop();
    });

    this.game.events.on('simulator-update-workers-machines', ({ numberOfWorkers, numberOfMachines }) => {
      this.game.events.emit('simulator-update-gangster-animation', { numberOfMachines });
      this.game.events.emit('simulator-update-goon-animation', { numberOfWorkers });
    });

    this.game.events.emit('simulator-request-workers-machines');
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
      this.popupSafeHouseUpgrade = new PopupSafeHouseUpgrade(this, {
        isSimulator: true,
        noCloseBtn: true,
        noBackground: true,
        originY: -120,
        onCompleted: () => {
          this.tutorial.step9.setVisible(false);
          this.tutorial.setVisible(false);
          setTimeout(() => {
            this.tutorial.setVisible(true);
            this.tutorial.step10.setVisible(true);
          }, 300);
        },
      }); // done
      this.add.existing(this.popupSafeHouseUpgrade);

      this.popupBuyGoon = new PopupBuyGoon(this, {
        isSimulator: true,
        noCloseBtn: true,
        noBackground: true,
        originY: -120,
        onCompleted: () => {
          this.tutorial.step7.setVisible(false);
          this.tutorial.setVisible(false);
          setTimeout(() => {
            this.tutorial.setVisible(true);
            this.tutorial.step8.setVisible(true);
          }, 300);
        },
      }); // done
      this.add.existing(this.popupBuyGoon);

      this.popupBuyGangster = new PopupBuyGangster(this, {
        isSimulator: true,
        noCloseBtn: true,
        noBackground: true,
        originY: -170,
        onCompleted: () => {
          this.tutorial.step4.setVisible(false);
          this.tutorial.setVisible(false);
          setTimeout(() => {
            this.tutorial.setVisible(true);
            this.tutorial.step5.setVisible(true);
          }, 300);
        },
      }); // done
      this.add.existing(this.popupBuyGangster);

      this.popupLeaderboard = new PopupLeaderboard(this, { isSimulator: true, noBackground: true });
      this.add.existing(this.popupLeaderboard);

      this.popupPrizePool = new PopupPrizePool(this, { isSimulator: true }); // done
      this.add.existing(this.popupPrizePool);

      this.popupWarMachines = new PopupWarMachines(this, {
        isSimulator: true,
        noBackground: true,
        onClickInfoButton: () => {
          this.tutorial.step11.setVisible(false);
          this.tutorial.step11.arrow.setVisible(false);
          this.tutorial.step12.setVisible(true);
        },
        onClickClose: () => {
          this.tutorial.step11.setVisible(false);
          this.tutorial.step11.arrow.setVisible(false);
          this.tutorial.step13.setVisible(true);
        },
      });
      this.add.existing(this.popupWarMachines);

      this.popupWarExplain = new PopupWarExplain(this, {
        noBackground: true,
        onClickBackButton: () => {
          this.tutorial.step12.setVisible(false);
          this.tutorial.step13.setVisible(true);
        },
      });
      this.add.existing(this.popupWarExplain);

      const footer = new Footer(this, 2600, { isSimulator: true }); // done
      footer.setDepth(1);
      this.add.existing(footer);
    });

    const infoButtons = new InfoButtons(this, 550, { isSimulator: true }); // done
    this.add.existing(infoButtons);

    this.tutorialOverlay = this.add.container(0, 0).setDepth(6);
    this.add.existing(this.tutorialOverlay);
    this.tutorial = new Tutorial(this, this.tutorialOverlay);
    this.add.existing(this.tutorial);
    this.tutorial.setDepth(2);
  }

  create() {}

  updateAnimationPositions(delta) {
    if (this.animationLayer.gangsterAction === 'back') {
      const { x, y } = this.animationLayer.gangsterBack;
      if (x >= gangsterAnimation.back.end.x || y <= gangsterAnimation.back.end.y) {
        this.game.events.emit('simulator-animation-gangster-front');
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
        this.game.events.emit('simulator-animation-gangster-back');
        this.game.events.emit('request-claimable-reward');
        // this.game.events.emit('check-game-ended');
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
        this.game.events.emit('simulator-animation-goon-front');
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
        this.game.events.emit('simulator-animation-goon-back');
        // this.game.events.emit('check-game-ended');
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

export default TutorialScene;
