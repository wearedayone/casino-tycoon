import Phaser from 'phaser';

import Button from '../button/Button';
import configs from '../../configs/configs';
import TutorialCharacter from './TutorialCharacter';

const { width, height } = configs;

const px = 40;
const buttonWidth = 288;
const y = 2600;

class Step2 extends Phaser.GameObjects.Container {
  clicked = false;

  constructor(scene, onNext) {
    super(scene, 0, 0);

    this.setVisible(false);

    this.character = new TutorialCharacter(scene, width / 2, height / 2 - 200, 'tutorial-2', onNext);
    this.add(this.character);

    this.activeButton = new Button(
      scene,
      width - px - buttonWidth / 2,
      y,
      'button-buy',
      'button-buy-pressed',
      () => {
        if (this.clicked) return;

        this.character.y -= 400;
        scene.popupWar.setVisible(false);
        scene.popupBuy.setDepth(5);
        scene.popupBuy.updateDisabled({ goonDisabled: true, gangsterDisabled: false, houseDisabled: true });
        scene.popupBuy.updateCallback(() => {
          scene.popupBuyGangster.setDepth(5);
          scene.popupBuy.setVisible(false);
          scene.popupBuyGangster.background?.destroy();
          onNext();
        });
        scene.popupBuy.setVisible(true);
      },
      { sound: 'button-1' }
    );
    this.add(this.activeButton);

    this.arrow = scene.add
      .image(this.activeButton.x, this.activeButton.y - this.activeButton.height / 2 - 20, 'tutorial-arrow-down')
      .setOrigin(0.5, 1);
    this.add(this.arrow);
  }
}

export default Step2;
