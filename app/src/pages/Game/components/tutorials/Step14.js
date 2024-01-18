import Phaser from 'phaser';

import configs from '../../configs/configs';
import TutorialCharacter from './TutorialCharacter';

const { width, height } = configs;

class Step14 extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);

    this.setVisible(false);

    this.arrow = scene.add.image(width / 2, height - 500, 'tutorial-arrow-up').setOrigin(0.5, 0);
    this.add(this.arrow);
  }
}

export default Step14;
