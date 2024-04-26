import Phaser from 'phaser';

import TutorialCharacter from './TutorialCharacter';
import Button from '../button/Button';
import configs from '../../configs/configs';

const { width, height } = configs;

const px = 40;
const buttonWidth = 288;
const y = 2600;

class Step10 extends Phaser.GameObjects.Container {
  clicked = false;

  constructor(scene, onNext) {
    super(scene, 0, 0);

    this.setVisible(false);

    const next = () => {
      scene.popupWar.setVisible(false);
      onNext();
    };

    this.character = new TutorialCharacter(scene, width / 2, height / 2 + 200, 'tutorial-10', () => {});
    this.add(this.character);

    this.activeButton = new Button(
      scene,
      0 + px + buttonWidth / 2,
      y,
      'button-war',
      'button-war-pressed',
      () => {
        if (this.clicked) return;
        this.clicked = true;

        this.character.y -= 400;
        this.arrow.setVisible(true);
        this.arrow1.setVisible(false);

        scene.popupWar.setDepth(5);
        scene.popupWar.updateDisabled({ historyDisabled: true, warDisabled: false });
        scene.popupWar.updateCallback(() => next());
        scene.popupWar.setVisible(!scene.popupWar.visible);
      },
      { sound: 'button-1' }
    );
    this.add(this.activeButton);

    this.arrow1 = scene.add
      .image(this.activeButton.x, this.activeButton.y - this.activeButton.height / 2 - 20, 'tutorial-arrow-down')
      .setOrigin(0.5, 1);
    this.add(this.arrow1);

    this.arrow = scene.add.image(360, 2210, 'tutorial-arrow-left').setOrigin(0, 0);
    this.arrow.setVisible(false);
    this.add(this.arrow);
  }
}

export default Step10;
