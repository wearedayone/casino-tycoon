import Phaser from 'phaser';

import Button from '../button/Button';
import configs from '../../configs/configs';
import TutorialCharacter from './TutorialCharacter';

const { width, height } = configs;

const px = 40;
const buttonWidth = 288;
const y = 2600;

class Step9 extends Phaser.GameObjects.Container {
  constructor(scene, onNext) {
    super(scene, 0, 0);

    this.setVisible(false);

    this.character = new TutorialCharacter(scene, width / 2, height / 2 - 200, 'tutorial-9', onNext);
    this.add(this.character);

    this.activeButton = new Button(
      scene,
      width - px - buttonWidth / 2,
      y,
      'button-buy',
      'button-buy-pressed',
      () => {
        this.character.y -= 400;
        scene.popupWar.setVisible(false);
        scene.popupBuy.setDepth(5);
        scene.popupBuy.updateDisabled({ goonDisabled: true, gangsterDisabled: true, houseDisabled: false });
        scene.popupBuy.updateCallback(() => {
          scene.popupSafeHouseUpgrade.setDepth(5);
          scene.popupSafeHouseUpgrade.background?.destroy();
          scene.popupBuy.setVisible(false);
          onNext();
        });
        scene.popupBuy.setVisible(!scene.popupBuy.visible);
        this.arrow.setVisible(true);
      },
      { sound: 'button-1' }
    );
    this.add(this.activeButton);

    this.arrow = scene.add.image(width - 360, 1620, 'tutorial-arrow-right').setOrigin(1, 0);
    this.arrow.setVisible(false);
    this.add(this.arrow);
  }
}

export default Step9;
