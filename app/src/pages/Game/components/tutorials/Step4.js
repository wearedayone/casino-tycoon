import Phaser from 'phaser';

import TutorialCharacter from './TutorialCharacter';
import configs from '../../configs/configs';

const { width, height } = configs;

class Step4 extends Phaser.GameObjects.Container {
  constructor(scene, overlayContainer) {
    super(scene, 0, 0);
    this.setVisible(false);

    this.arrow = scene.add
      .image(width / 2, height / 2 + 790, 'tutorial-arrow-up')
      .setOrigin(0.5, 0)
      .setVisible(false);
    overlayContainer.add(this.arrow);

    this.character = new TutorialCharacter(scene, width / 2, height - 220, 'tutorial-4', () => {});
    this.add(this.character);

    scene.game.events.on('simulator-buy-gangster', () => {
      this.scene.tutorial.setDepth(2);
      this.arrow.setVisible(false);
      this.character.setVisible(false);
    });
  }

  start() {
    this.setVisible(true);
    this.arrow.setVisible(true);
  }
}

export default Step4;
