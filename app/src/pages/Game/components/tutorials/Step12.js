import Phaser from 'phaser';

import Button from '../button/Button';
import RankButton from '../action-buttons/RankButton';
import configs from '../../configs/configs';
import TutorialCharacter from './TutorialCharacter';

const { width, height } = configs;

const y = 550;
const px = 40;
const buttonSize = 186;

class Step12 extends Phaser.GameObjects.Container {
  constructor(scene, onNext) {
    super(scene, 0, 0);

    this.setVisible(false);

    const next = () => {
      scene.popupLeaderboard.setDepth(5);
      scene.popupLeaderboard.background?.destroy();
      scene.popupLeaderboard.open();
      onNext();
    };

    this.character = new TutorialCharacter(scene, width / 2, height / 2 + 400, 'tutorial-12', next);
    this.add(this.character);

    this.rankButton = new RankButton(
      scene,
      width - px - buttonSize / 2,
      y,
      'button-rank',
      'button-rank-pressed',
      () => next(),
      { sound: 'button-1' }
    );
    this.add(this.rankButton);

    this.arrow = scene.add
      .image(width - px - buttonSize - 20, this.rankButton.y, 'tutorial-arrow-right')
      .setOrigin(1, 0.5);
    this.add(this.arrow);
  }
}

export default Step12;
