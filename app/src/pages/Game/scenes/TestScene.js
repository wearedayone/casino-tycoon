import Phaser from 'phaser';

class Example extends Phaser.Scene {
  constructor() {
    super();
  }

  preload() {
    this.load.path = '/images/animation/';
    this.load.multiatlas('run', 'test.json');
    // this.load.spritesheet('goon', '/images/animation/test.png', { frameWidth: 895, frameHeight: 895 });
  }

  create() {
    // this.capguy = this.add.sprite(400, 400, 'test', 'test-0.png');
    const frames = this.anims.generateFrameNames('run', {
      start: 1,
      end: 77,
      zeroPad: 5,
      prefix: 'gangster_front_view_running_cycle_',
      suffix: '.png',
    });
    console.log(frames);
    this.anims.create({ key: 'fly', frames, frameRate: 24, repeat: -1 });
    const goon = this.add.sprite(400, 300).setScale(2.7);
    goon.setScale(0.5);
    goon.play('fly');
    // const frameNames = this.anims.generateFrameNames('test-frames', {
    //   start: 0,
    //   end: 3,
    //   zeroPad: 0,
    //   prefix: 'images/animation/test-',
    //   suffix: '.png',
    // });

    // console.log({ frameNames });

    // this.anims.create({ key: 'walk', frames: frameNames, frameRate: 10, repeat: -1 });
    // this.capguy.anims.play('walk');

    // Animation set
    // this.anims.create({
    //   key: 'walk',
    //   frames: this.anims.generateFrameNumbers('goon', { frames: [0, 1, 2, 4, 5, 6, 8, 9, 10, 12, 13, 14, 15] }),
    //   frameRate: 8,
    //   repeat: -1,
    // });

    // const cody = this.add.sprite(600, 600);
    // cody.setScale(0.5);
    // cody.play('walk');
  }
}

export default Example;
