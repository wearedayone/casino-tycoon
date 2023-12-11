import Phaser from 'phaser';

import configs from '../../configs/configs';

const { width, height } = configs;

class Background extends Phaser.GameObjects.Container {
  constructor(scene, key = 'bg') {
    super(scene, 0, 0);

    this.background = scene.add.image((width - 1700) / 2, 0, key).setOrigin(0, 0);
    const scaleX = width / this.background.width;
    const scaleY = height / this.background.height;
    const scale = Math.max(scaleX, scaleY);
    this.background.setScale(1).setScrollFactor(0);
    this.background.depth = -1;

    this.add(this.background);
  }
}

export default Background;
