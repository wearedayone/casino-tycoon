import Phaser from 'phaser';

import TutorialCharacter from './TutorialCharacter';
import configs from '../../configs/configs';

const { width, height } = configs;

class Step14 extends Phaser.GameObjects.Container {
  constructor(scene, onNext) {
    super(scene, 0, 0);

    this.setVisible(false);

    const next = () => {
      scene.popupReferralProgram.close();

      onNext();
    };

    this.character = new TutorialCharacter(scene, width / 2, height - 260, 'tutorial-14', next);
    this.add(this.character);
  }
}

export default Step14;
