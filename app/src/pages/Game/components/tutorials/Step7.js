import Phaser from 'phaser';

import TutorialCharacter from './TutorialCharacter';
import configs from '../../configs/configs';

const { width, height } = configs;

class Step7 extends Phaser.GameObjects.Container {
  constructor(scene, overlayContainer) {
    super(scene, 0, 0);

    this.setVisible(false);

    this.arrow = scene.add
      .image(width / 2, height / 2 + 730, 'tutorial-arrow-up')
      .setOrigin(0.5, 0)
      .setVisible(false);
    overlayContainer.add(this.arrow);

    this.character = new TutorialCharacter(scene, width / 2, height - 240, 'tutorial-7', () => {});
    this.add(this.character);

    scene.game.events.on('simulator-buy-goon', () => {
      this.arrow.setVisible(false);
      this.character.setVisible(false);
    });
  }

  start() {
    this.setVisible(true);
    this.arrow.setVisible(true);
  }
}

export default Step7;
