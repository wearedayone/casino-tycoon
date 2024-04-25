import Phaser from 'phaser';

import TutorialCharacter from './TutorialCharacter';
import InfoButtons from '../action-buttons/InfoButtons';
import configs from '../../configs/configs';

const { width, height } = configs;

const px = 40;
const buttonWidth = 230;

class Step13 extends Phaser.GameObjects.Container {
  clicked = false;

  constructor(scene) {
    super(scene, 0, 0);

    this.setVisible(false);

    this.character = new TutorialCharacter(scene, width / 2, height - 800, 'tutorial-13', () => {});
    this.add(this.character);

    this.infoButton = new InfoButtons(scene, 550, {
      noBackground: true,
      hideSettings: true,
      hideLeaderboard: true,
      hidePortfolio: true,
      dailySpinDisabled: true,
      holdingRewardDisabled: true,
      onClickReward: () => {
        if (this.clicked) return;
        this.clicked = true;

        if (this.arrow.y !== 1022) {
          this.arrow.y = 1022;
          this.arrow.x = buttonWidth + px + 230;
        } else this.arrow.y = 786;
      },
    });
    this.add(this.infoButton);

    this.arrow = scene.add.image(buttonWidth + px, 786, 'tutorial-arrow-left').setOrigin(0, 0.5);
    this.add(this.arrow);
  }
}

export default Step13;
