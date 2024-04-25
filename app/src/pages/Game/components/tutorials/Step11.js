import Phaser from 'phaser';

import TutorialCharacter from './TutorialCharacter';
import configs from '../../configs/configs';

const { width, height } = configs;

class Step11 extends Phaser.GameObjects.Container {
  constructor(scene, overlayContainer, onNext) {
    super(scene, 0, 0);

    this.setVisible(false);

    this.arrow = scene.add
      .image(width / 2 - 500, height / 2 + 680, 'tutorial-arrow-right')
      .setOrigin(1, 0)
      .setVisible(false);
    overlayContainer.add(this.arrow);

    this.character = new TutorialCharacter(scene, width / 2, height - 240, 'tutorial-11', () => {});
    this.add(this.character);
  }

  start() {
    this.setVisible(true);
    this.arrow.setVisible(true);
  }
}

export default Step11;
