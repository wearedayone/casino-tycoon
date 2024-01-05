import Phaser from 'phaser';

import Button from '../button/Button';
import configs from '../../configs/configs';
import TutorialCharacter from './TutorialCharacter';

const { width, height } = configs;

const px = 40;
const buttonWidth = 288;
const y = 2600;

class Step14 extends Phaser.GameObjects.Container {
  clicked = false;
  constructor(scene, onNext) {
    super(scene, 0, 0);

    this.setVisible(false);

    const next = () => {
      scene.popupWar.setVisible(false);
      scene.popupDailyGangWar.setDepth(5);
      scene.popupDailyGangWar.background?.destroy();
      scene.popupDailyGangWar.setVisible(true);
      onNext();
    };

    this.character = new TutorialCharacter(scene, width / 2, height / 2 - 200, 'tutorial-14', next);
    this.add(this.character);

    this.activeButton = new Button(
      scene,
      buttonWidth / 2 + px,
      y,
      'button-war',
      'button-war-pressed',
      () => {
        if (this.clicked) return;
        this.clicked = true;

        this.character.y -= 400;
        this.arrow1.setVisible(false);
        this.arrow.setVisible(true);
        scene.popupBuy.setVisible(false);
        scene.popupWar.setDepth(5);
        scene.popupWar.updateDisabled({ historyDisabled: true, warDisabled: false });
        scene.popupWar.updateCallback(() => next());
        scene.popupWar.setVisible(true);
      },
      { sound: 'button-1' }
    );
    this.add(this.activeButton);

    this.arrow = scene.add.image(buttonWidth + px, 2380, 'tutorial-arrow-left').setOrigin(0, 0.5);
    this.arrow.setVisible(false);
    this.add(this.arrow);

    this.arrow1 = scene.add
      .image(this.activeButton.x, this.activeButton.y - this.activeButton.height / 2 - 20, 'tutorial-arrow-down')
      .setOrigin(0.5, 1);
    this.add(this.arrow1);
  }
}

export default Step14;