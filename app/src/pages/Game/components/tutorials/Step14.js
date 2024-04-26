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

    this.onNext = next;

    this.character = new TutorialCharacter(scene, width / 2, height - 260, 'tutorial-14', next);
    this.add(this.character);
  }

  start() {
    this.scene.tutorial.background.removeAllListeners();
    this.scene.tutorial.background.setInteractive().on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      this.onNext();
    });
    this.setVisible(true);
  }
}

export default Step14;
