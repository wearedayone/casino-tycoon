import Phaser from 'phaser';

import configs from '../../configs/configs';
import TutorialCharacter from './TutorialCharacter';

const { width, height } = configs;

class Step15 extends Phaser.GameObjects.Container {
  constructor(scene, onNext) {
    super(scene, 0, 0);

    this.setVisible(false);

    console.log(scene.popupDailyGangWar, scene.popupDailyGangWar.children);

    scene.popupDailyGangWar.list.map((item) => (item.y -= 270));

    this.image = scene.add.image(width / 2, height - 300, 'tutorial-15').setOrigin(0.5, 0.5);
    this.add(this.image);

    this.nextButton = scene.add
      .image(this.image.x + this.image.width / 2 - 100, this.image.y - this.image.height / 2 + 120, 'tutorial-next')
      .setOrigin(0.5, 0.5);
    this.add(this.nextButton);
    this.nextButton.setInteractive().on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      onNext();
    });
  }
}

export default Step15;
