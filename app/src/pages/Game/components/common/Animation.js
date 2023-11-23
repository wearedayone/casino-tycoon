import Phaser from 'phaser';

import configs from '../../configs/configs';

const { gangsterAnimation, goonAnimation } = configs;

class Animation extends Phaser.GameObjects.Container {
  goonAction = null;
  gangsterAction = null;

  constructor(scene) {
    super(scene, 0, 0);

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
      prefix: 'goon_back_view_running_cycle_sequence_',
      suffix: '.png',
    });

    scene.anims.create({ key: 'gangster-front-run', frames: gangsterFrontFrames, frameRate: 24, repeat: -1 });
    scene.anims.create({ key: 'gangster-back-run', frames: gangsterBackFrames, frameRate: 24, repeat: -1 });
    scene.anims.create({ key: 'goon-front-run', frames: goonFrontFrames, frameRate: 24, repeat: -1 });
    scene.anims.create({ key: 'goon-back-run', frames: goonBackFrames, frameRate: 24, repeat: -1 });

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

    scene.game.events.on('animation-gangster-back', () => {
      this.gangsterAction = 'back';
      this.gangsterFront.anims.stop();
      this.gangsterFront.setVisible(false);
      this.gangsterFront.x = gangsterAnimation.front.start.x;
      this.gangsterFront.y = gangsterAnimation.front.start.y;
      this.gangsterFront.setScale(gangsterAnimation.front.start.scale);
      this.gangsterBack.setVisible(true);
      this.gangsterBack.play('gangster-back-run');

      /// update number of machines
    });

    scene.game.events.on('animation-gangster-front', () => {
      this.gangsterAction = 'front';
      this.gangsterBack.anims.stop();
      this.gangsterBack.setVisible(false);
      this.gangsterBack.x = gangsterAnimation.back.start.x;
      this.gangsterBack.y = gangsterAnimation.back.start.y;
      this.gangsterBack.setScale(gangsterAnimation.back.start.scale);
      this.gangsterFront.setVisible(true);
      this.gangsterFront.play('gangster-front-run');

      // update number of machines
    });

    scene.game.events.on('animation-goon-back', () => {
      this.goonAction = 'back';
      this.goonFront.anims.stop();
      this.goonFront.setVisible(false);
      this.goonFront.x = goonAnimation.front.start.x;
      this.goonFront.y = goonAnimation.front.start.y;
      this.goonFront.setScale(goonAnimation.front.start.scale);
      this.goonBack.setVisible(true);
      this.goonBack.play('goon-back-run');
    });

    scene.game.events.on('animation-goon-front', () => {
      this.goonAction = 'front';
      this.goonBack.anims.stop();
      this.goonBack.setVisible(false);
      this.goonBack.x = goonAnimation.back.start.x;
      this.goonBack.y = goonAnimation.back.start.y;
      this.goonBack.setScale(goonAnimation.back.start.scale);
      this.goonFront.setVisible(true);
      this.goonFront.play('goon-front-run');
    });

    scene.game.events.on('update-gangster-animation', ({ numberOfMachines }) => {
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
          this.gangsterBack.play('gangster-back-run');
        }
      }
    });

    scene.game.events.on('update-goon-animation', ({ numberOfWorkers }) => {
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
          this.goonBack.play('goon-back-run');
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
