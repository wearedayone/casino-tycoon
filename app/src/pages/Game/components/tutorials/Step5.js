import Phaser from 'phaser';

import configs from '../../configs/configs';
import Button from '../button/Button';
import TutorialCharacter from './TutorialCharacter';

const { width, height } = configs;

const y = 2600;

class Step5 extends Phaser.GameObjects.Container {
  constructor(scene, onNext) {
    super(scene, 0, 0);

    this.setVisible(false);

    this.character = new TutorialCharacter(scene, width / 2, height / 2 - 650, 'tutorial-5', onNext);
    this.add(this.character);

    this.gangster = scene.add.image(300, height / 2 + 300, 'tutorial-5-gangster');
    this.add(this.gangster);

    this.claimButton = new Button(
      scene,
      width / 2,
      y,
      'tutorial-claim-inactive-btn',
      'tutorial-claim-inactive-btn',
      onNext
    );
    this.add(this.claimButton);

    this.arrow = scene.add.image(width / 2, 2500, 'tutorial-arrow-down').setOrigin(0.5, 1);
    this.add(this.arrow);
  }
}

export default Step5;
