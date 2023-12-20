import Phaser from 'phaser';

import configs from '../../configs/configs';
import TutorialCharacter from './TutorialCharacter';

const { width, height } = configs;

class Step4 extends Phaser.GameObjects.Container {
  constructor(scene, onNext) {
    super(scene, 0, 0);

    this.setVisible(false);

    this.character = new TutorialCharacter(scene, width / 2, height - 800, 'tutorial-4', onNext);
    this.add(this.character);

    this.gangster = scene.add.image(500, height / 2, 'tutorial-4-gangster');
    this.add(this.gangster);
  }
}

export default Step4;
