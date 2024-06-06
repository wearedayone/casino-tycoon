import Phaser from 'phaser';

import configs from '../../configs/configs';
import TutorialCharacter from './TutorialCharacter';

const { width, height } = configs;

class Step11 extends Phaser.GameObjects.Container {
  constructor(scene, onNext) {
    super(scene, 0, 0);

    this.setVisible(false);

    const next = () => {
      scene.popupLeaderboard.setDepth(5);
      scene.popupLeaderboard.background?.destroy();
      scene.tutorial.background.setDisplaySize(width, height);
      scene.tutorial.lowerBackground?.destroy();
      onNext();
    };

    this.character = new TutorialCharacter(scene, width / 2, height / 2 + 500, 'tutorial-11', next);
    this.add(this.character);
  }
}

export default Step11;
