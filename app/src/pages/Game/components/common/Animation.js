import Phaser from 'phaser';

import configs from '../../configs/configs';

const { gangsterAnimation, goonAnimation } = configs;

class Animation extends Phaser.GameObjects.Container {
  goonAction = null;
  gangsterAction = null;

  constructor(scene, { isSimulator } = {}) {
    super(scene, 0, 0);

    const events = {
      stopAnimation: isSimulator ? 'simulator-stop-animation' : 'stop-animation',
      animationGangsterBack: isSimulator ? 'simulator-animation-gangster-back' : 'animation-gangster-back',
      animationGangsterFront: isSimulator ? 'simulator-animation-gangster-front' : 'animation-gangster-front',
      animationGoonBack: isSimulator ? 'simulator-animation-goon-back' : 'animation-goon-back',
      animationGoonFront: isSimulator ? 'simulator-animation-goon-front' : 'animation-goon-front',
      updateGangsterAnimation: isSimulator ? 'simulator-update-gangster-animation' : 'update-gangster-animation',
      updateGoonAnimation: isSimulator ? 'simulator-update-goon-animation' : 'update-goon-animation',
    };

    const animations = {
      gangsterFrontRun: isSimulator ? 'simulator-gangster-front-run' : 'gangster-front-run',
      gangsterBackRun: isSimulator ? 'simulator-gangster-back-run' : 'gangster-back-run',
      goonFrontRun: isSimulator ? 'simulator-goon-front-run' : 'goon-front-run',
      goonBackRun: isSimulator ? 'simulator-goon-back-run' : 'goon-back-run',
    };

    this.coinbagPickupSound = scene.sound.add('coinbag-pickup', { loop: false });

    this.gangsterCounterContainer = scene.add.image(0, 0, 'counter').setOrigin(0.5, 0.5);
    this.gangsterCounterText = scene.add
      .text(0, 0, '0', {
        fontSize: '42px',
        color: '#311FA9',
        fontFamily: 'WixMadeforDisplayExtraBold',
      })
      .setOrigin(0.5, 0.5);
    this.gangsterCounterContainer.setVisible(false);
    this.gangsterCounterText.setVisible(false);
    this.add(this.gangsterCounterContainer);
    this.add(this.gangsterCounterText);

    this.goonCounterContainer = scene.add.image(0, 0, 'counter').setOrigin(0.5, 0.5);
    this.goonCounterText = scene.add
      .text(0, 0, '0', {
        fontSize: '42px',
        color: '#311FA9',
        fontFamily: 'WixMadeforDisplayExtraBold',
      })
      .setOrigin(0.5, 0.5);
    this.goonCounterContainer.setVisible(false);
    this.goonCounterText.setVisible(false);
    this.add(this.goonCounterContainer);
    this.add(this.goonCounterText);

    const gangsterFrontFrames = scene.anims.generateFrameNames('gangster-front', {
      start: 1,
      end: 77,
      zeroPad: 5,
      prefix: 'gangster_front_view_running_cycle_',
      suffix: '.png',
    });

    const gangsterBackFrames = scene.anims.generateFrameNames('gangster-back', {
      start: 1,
      end: 78,
      zeroPad: 5,
      prefix: 'gangster_back_view_running_cycle_',
      suffix: '.png',
    });

    const goonFrontFrames = scene.anims.generateFrameNames('goon-front', {
      start: 1,
      end: 78,
      zeroPad: 5,
      prefix: 'goon_front_view_running_cycle_',
      suffix: '.png',
    });

    const goonBackFrames = scene.anims.generateFrameNames('goon-back', {
      start: 1,
      end: 78,
      zeroPad: 5,
      prefix: 'goon_back_view_running_cycle_',
      suffix: '.png',
    });

    scene.anims.create({ key: animations.gangsterFrontRun, frames: gangsterFrontFrames, frameRate: 24, repeat: -1 });
    scene.anims.create({ key: animations.gangsterBackRun, frames: gangsterBackFrames, frameRate: 24, repeat: -1 });
    scene.anims.create({ key: animations.goonFrontRun, frames: goonFrontFrames, frameRate: 24, repeat: -1 });
    scene.anims.create({ key: animations.goonBackRun, frames: goonBackFrames, frameRate: 24, repeat: -1 });

    this.gangsterFront = scene.add
      .sprite(gangsterAnimation.front.start.x, gangsterAnimation.front.start.y)
      .setScale(gangsterAnimation.front.start.scale)
      .setVisible(false);

    this.gangsterBack = scene.add
      .sprite(gangsterAnimation.back.start.x, gangsterAnimation.back.start.y)
      .setScale(gangsterAnimation.back.start.scale)
      .setVisible(false);

    this.goonFront = scene.add
      .sprite(goonAnimation.front.start.x, goonAnimation.front.start.y)
      .setScale(goonAnimation.front.start.scale)
      .setVisible(false);

    this.goonBack = scene.add
      .sprite(goonAnimation.back.start.x, goonAnimation.back.start.y)
      .setScale(goonAnimation.back.start.scale)
      .setVisible(false);

    scene.game.events.on(events.stopAnimation, () => {
      this.gangsterAction = null;
      this.goonAction = null;

      this.gangsterFront.anims.stop();
      this.gangsterFront.setVisible(false);
      this.gangsterBack.anims.stop();
      this.gangsterBack.setVisible(false);
      this.gangsterCounterContainer.setVisible(false);
      this.gangsterCounterText.setVisible(false);

      this.goonFront.anims.stop();
      this.goonFront.setVisible(false);
      this.goonBack.anims.stop();
      this.goonBack.setVisible(false);
      this.goonCounterContainer.setVisible(false);
      this.goonCounterText.setVisible(false);
    });

    scene.game.events.on(events.animationGangsterBack, () => {
      this.gangsterAction = 'back';
      this.gangsterFront.anims.stop();
      this.gangsterFront.setVisible(false);
      this.gangsterFront.x = gangsterAnimation.front.start.x;
      this.gangsterFront.y = gangsterAnimation.front.start.y;
      this.gangsterFront.setScale(gangsterAnimation.front.start.scale);
      this.gangsterBack.setVisible(true);
      this.gangsterBack.play(animations.gangsterBackRun);

      /// update number of machines
    });

    scene.game.events.on(events.animationGangsterFront, () => {
      this.coinbagPickupSound.play();
      this.gangsterAction = 'front';
      this.gangsterBack.anims.stop();
      this.gangsterBack.setVisible(false);
      this.gangsterBack.x = gangsterAnimation.back.start.x;
      this.gangsterBack.y = gangsterAnimation.back.start.y;
      this.gangsterBack.setScale(gangsterAnimation.back.start.scale);
      this.gangsterFront.setVisible(true);
      this.gangsterFront.play(animations.gangsterFrontRun);

      // update number of machines
    });

    scene.game.events.on(events.animationGoonBack, () => {
      this.goonAction = 'back';
      this.goonFront.anims.stop();
      this.goonFront.setVisible(false);
      this.goonFront.x = goonAnimation.front.start.x;
      this.goonFront.y = goonAnimation.front.start.y;
      this.goonFront.setScale(goonAnimation.front.start.scale);
      this.goonBack.setVisible(true);
      this.goonBack.play(animations.goonBackRun);
    });

    scene.game.events.on(events.animationGoonFront, () => {
      this.coinbagPickupSound.play();
      this.goonAction = 'front';
      this.goonBack.anims.stop();
      this.goonBack.setVisible(false);
      this.goonBack.x = goonAnimation.back.start.x;
      this.goonBack.y = goonAnimation.back.start.y;
      this.goonBack.setScale(goonAnimation.back.start.scale);
      this.goonFront.setVisible(true);
      this.goonFront.play(animations.goonFrontRun);
    });

    scene.game.events.on(events.updateGangsterAnimation, ({ numberOfMachines }) => {
      if (!numberOfMachines) {
        this.gangsterAction = null;
        this.gangsterFront.anims.stop();
        this.gangsterFront.setVisible(false);
        this.gangsterFront.x = gangsterAnimation.front.start.x;
        this.gangsterFront.y = gangsterAnimation.front.start.y;
        this.gangsterFront.setScale(gangsterAnimation.front.start.scale);
        this.gangsterBack.anims.stop();
        this.gangsterBack.setVisible(false);
        this.gangsterBack.x = gangsterAnimation.back.start.x;
        this.gangsterBack.y = gangsterAnimation.back.start.y;
        this.gangsterBack.setScale(gangsterAnimation.back.start.scale);
        this.gangsterCounterContainer.setVisible(false);
        this.gangsterCounterText.setVisible(false);
      } else {
        if (!this.gangsterCounterContainer.visible) {
          this.gangsterCounterContainer.setVisible(true);
          this.gangsterCounterText.setVisible(true);
        }
        this.gangsterCounterText.text = `${numberOfMachines}`;
        if (!this.gangsterAction) {
          this.gangsterAction = 'back';
          this.gangsterFront.anims.stop();
          this.gangsterFront.setVisible(false);
          this.gangsterFront.x = gangsterAnimation.front.start.x;
          this.gangsterFront.y = gangsterAnimation.front.start.y;
          this.gangsterFront.setScale(gangsterAnimation.front.start.scale);
          this.gangsterBack.setVisible(true);
          this.gangsterBack.play(animations.gangsterBackRun);
        }
      }
    });

    scene.game.events.on(events.updateGoonAnimation, ({ numberOfWorkers }) => {
      if (!numberOfWorkers) {
        this.goonAction = null;
        this.goonFront.anims.stop();
        this.goonFront.setVisible(false);
        this.goonFront.x = goonAnimation.front.start.x;
        this.goonFront.y = goonAnimation.front.start.y;
        this.goonFront.setScale(goonAnimation.front.start.scale);
        this.goonBack.anims.stop();
        this.goonBack.setVisible(false);
        this.goonBack.x = goonAnimation.back.start.x;
        this.goonBack.y = goonAnimation.back.start.y;
        this.goonBack.setScale(goonAnimation.back.start.scale);
        this.goonCounterContainer.setVisible(false);
        this.goonCounterText.setVisible(false);
      } else {
        if (!this.goonCounterContainer.visible) {
          this.goonCounterContainer.setVisible(true);
          this.goonCounterText.setVisible(true);
        }
        this.goonCounterText.text = `${numberOfWorkers}`;
        if (!this.goonAction) {
          this.goonAction = 'back';
          this.goonFront.anims.stop();
          this.goonFront.setVisible(false);
          this.goonFront.x = goonAnimation.front.start.x;
          this.goonFront.y = goonAnimation.front.start.y;
          this.goonFront.setScale(goonAnimation.front.start.scale);
          this.goonBack.setVisible(true);
          this.goonBack.play(animations.goonBackRun);
        }
      }
    });
  }

  updateGangsterCounter(x, y) {
    this.gangsterCounterContainer.x = x;
    this.gangsterCounterContainer.y = y;
    this.gangsterCounterText.x = x;
    this.gangsterCounterText.y = y;
  }

  updateGoonCounter(x, y) {
    this.goonCounterContainer.x = x;
    this.goonCounterContainer.y = y;
    this.goonCounterText.x = x;
    this.goonCounterText.y = y;
  }
}

export default Animation;
