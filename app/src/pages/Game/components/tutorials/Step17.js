import Phaser from 'phaser';

import configs from '../../configs/configs';
import TutorialCharacter from './TutorialCharacter';

const { width, height } = configs;

class Step17 extends Phaser.GameObjects.Container {
  constructor(scene, onNext) {
    super(scene, 0, 0);

    this.setVisible(false);

    this.character = new TutorialCharacter(scene, width / 2, height / 2 - 600, 'tutorial-17', onNext);
    this.add(this.character);

    this.goon = scene.add.image(300, height / 2 + 300, 'tutorial-17-goon');
    this.add(this.goon);

    this.arrow = scene.add.image(300 + this.goon.width / 2, height / 2 + 300, 'tutorial-arrow-left').setOrigin(0, 0.5);
    this.add(this.arrow);
  }
}

export default Step17;
