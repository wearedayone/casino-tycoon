import Phaser from 'phaser';

import RankButton from '../action-buttons/RankButton';
import configs from '../../configs/configs';

const { width, height } = configs;

const y = 550;
const px = 40;
const buttonSize = 186;

class Step10 extends Phaser.GameObjects.Container {
  constructor(scene, onNext) {
    super(scene, 0, 0);

    this.setVisible(false);

    const next = () => {
      scene.popupLeaderboard.setDepth(1);
      scene.popupLeaderboard.open();

      // background with a gap
      scene.tutorial.background.setDisplaySize(width, scene.popupLeaderboard.prizePoolContainerY - 120);
      const lowerBgY = scene.popupLeaderboard.leaderboardY - 100;
      scene.tutorial.lowerBackground = scene.add
        .rectangle(0, lowerBgY, width, height - lowerBgY, 0x260343, 0.8)
        .setOrigin(0, 0)
        .setDepth(1);
      scene.add.existing(scene.tutorial.lowerBackground);

      onNext();
    };

    this.rankButton = new RankButton(
      scene,
      width - px - buttonSize / 2,
      y,
      'button-rank',
      'button-rank-pressed',
      () => next(),
      { sound: 'button-1', isSimulator: true }
    );
    this.add(this.rankButton);

    this.arrow = scene.add
      .image(width - px - buttonSize - 20, this.rankButton.y, 'tutorial-arrow-right')
      .setOrigin(1, 0.5);
    this.add(this.arrow);
  }
}

export default Step10;
