import Phaser from 'phaser';

import configs from '../../configs/configs';

const { width, height } = configs;

class Step6 extends Phaser.GameObjects.Container {
  constructor(scene, onNext) {
    super(scene, 0, 0);

    this.setVisible(false);

    this.arrow = scene.add.image(width / 2, height - 550, 'tutorial-arrow-up').setOrigin(0.5, 0);
    this.add(this.arrow);

    scene.game.events.on('simulator-buy-goon', () => {
      this.arrow.setVisible(false);
    });
  }
}

export default Step6;
