import Phaser from 'phaser';

import Balance from '../action-buttons/Balance';
import configs from '../../configs/configs';
import TutorialCharacter from './TutorialCharacter';

const { width, height } = configs;

const buttonWidth = 400;
const gap = buttonWidth + 20;
const y = 250;

class Step16 extends Phaser.GameObjects.Container {
  constructor(scene, onNext) {
    super(scene, 0, 0);

    this.setVisible(false);

    this.character = new TutorialCharacter(scene, width / 2, height / 2 + 400, 'tutorial-16', onNext);
    this.add(this.character);

    this.ethBalance = new Balance(
      scene,
      width / 2 + gap,
      y,
      () => {
        scene.popupDeposit.open();
      },
      'eth-balance',
      '100k'
    );
    this.add(this.ethBalance);

    this.arrow = scene.add
      .image(
        this.ethBalance.container.x + 20,
        this.ethBalance.container.y + this.ethBalance.container.height / 2 + 20,
        'tutorial-arrow-up'
      )
      .setOrigin(0.5, 0);
    this.add(this.arrow);
  }
}

export default Step16;
