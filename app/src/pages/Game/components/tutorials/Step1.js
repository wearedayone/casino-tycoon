import Phaser from 'phaser';

import configs from '../../configs/configs';
import TutorialCharacter from './TutorialCharacter';

const { width, height } = configs;

class Step1 extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);

    this.setVisible(false);

    this.character = new TutorialCharacter(scene, width / 2, height - 650, 'tutorial-1');
    this.add(this.character);
  }
}

export default Step1;
