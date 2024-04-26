import Phaser from 'phaser';

import TutorialCharacter from './TutorialCharacter';
import Balance from '../action-buttons/Balance';
import configs from '../../configs/configs';

const { width, height } = configs;

const buttonWidth = 400;
const gap = buttonWidth + 20;
const y = 250;

class Step15 extends Phaser.GameObjects.Container {
  constructor(scene, overlayContainer) {
    super(scene, 0, 0);

    this.setVisible(false);

    this.character = new TutorialCharacter(scene, width / 2, height - 1000, 'tutorial-15', () => {});
    this.character.setVisible(false);
    overlayContainer.add(this.character);

    this.ethBalance = new Balance(
      scene,
      width / 2 + gap,
      y,
      () => {
        scene.popupDeposit.open();
      },
      'eth-balance',
      scene.header.ethBalance.valueText.text
    );
    this.add(this.ethBalance);

    this.arrow = scene.add
      .image(
        this.ethBalance.addButton.x,
        this.ethBalance.container.y + this.ethBalance.container.height / 2 + 20,
        'tutorial-arrow-up'
      )
      .setOrigin(0.5, 0)
      .setVisible(false);
    overlayContainer.add(this.arrow);
  }

  start() {
    this.setVisible(true);
    this.character.setVisible(true);
    this.arrow.setVisible(true);
  }

  moveArrowToDepositBtn() {
    this.ethBalance.setVisible(false);
    this.arrow.x = width / 2 + 330;
    this.arrow.y = height / 2 - 300;
    this.character.y += 400;
  }
}

export default Step15;
