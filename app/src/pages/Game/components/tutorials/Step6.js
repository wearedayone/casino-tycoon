import Phaser from 'phaser';

import TutorialCharacter from './TutorialCharacter';
import Button from '../button/Button';
import configs from '../../configs/configs';

const { width, height } = configs;

const px = 40;
const buttonWidth = 288;
const y = 2600;

class Step6 extends Phaser.GameObjects.Container {
  clicked = false;

  constructor(scene, onNext) {
    super(scene, 0, 0);

    this.setVisible(false);

    const next = () => {
      scene.popupBuy.setVisible(false);
      scene.popupBuyGoon.open();
      onNext();
    };

    this.character = new TutorialCharacter(scene, width / 2, height / 2, 'tutorial-6', () => {});
    this.add(this.character);

    this.activeButton = new Button(
      scene,
      width - px - buttonWidth / 2,
      y,
      'button-buy',
      'button-buy-pressed',
      () => {
        if (this.clicked) return;
        this.clicked = true;

        this.character.y -= 400;
        this.arrow1.setVisible(false);
        this.arrow.setVisible(true);
        scene.popupWar.setVisible(false);
        scene.popupBuy.setDepth(5);
        scene.popupBuy.updateDisabled({ goonDisabled: false, gangsterDisabled: true, houseDisabled: true });
        scene.popupBuy.updateCallback(() => next());
        scene.popupBuy.setVisible(!scene.popupBuy.visible);
      },
      { sound: 'button-1' }
    );
    this.add(this.activeButton);

    this.arrow1 = scene.add
      .image(this.activeButton.x, this.activeButton.y - this.activeButton.height / 2 - 20, 'tutorial-arrow-down')
      .setOrigin(0.5, 1);
    this.add(this.arrow1);

    this.arrow = scene.add.image(width - 360, 2180, 'tutorial-arrow-right').setOrigin(1, 0);
    this.arrow.setVisible(false);
    this.add(this.arrow);
  }
}

export default Step6;
