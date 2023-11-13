import Phaser from 'phaser';

import configs from '../configs/configs.json';

const { width, height } = configs;

class Background extends Phaser.GameObjects.Container {
  constructor(scene, img) {
    super(scene, 0, 0);

    this.background = scene.add.image(0, 0, 'bg').setOrigin(0, 0);
    const scaleX = width / this.background.width;
    const scaleY = height / this.background.height;
    const scale = Math.max(scaleX, scaleY);
    this.background.setScale(scale).setScrollFactor(0);
    this.background.depth = -1;

    this.add(this.background);
  }
}

export default Background;
