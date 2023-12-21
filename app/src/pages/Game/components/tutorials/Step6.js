import Phaser from 'phaser';

import configs from '../../configs/configs';
import Button from '../button/Button';
import TutorialCharacter from './TutorialCharacter';

const { width, height } = configs;

const y = 2600;

class Step6 extends Phaser.GameObjects.Container {
  constructor(scene, onNext) {
    super(scene, 0, 0);

    this.setVisible(false);

    this.character = new TutorialCharacter(scene, width / 2, height / 2 + 200, 'tutorial-6', onNext);
    this.add(this.character);

    this.claimButtonLight = scene.add.image(width / 2, y, 'tutorial-6-claim-btn-light').setOrigin(0.5, 0.5);
    this.add(this.claimButtonLight);

    this.claimButton = new Button(scene, width / 2, y, 'tutorial-6-claim-btn', 'tutorial-6-claim-btn', () => {
      onNext();
      scene.game.events.emit('simulator-claim-completed', { amount: 15000 });
    });
    this.add(this.claimButton);

    this.arrow = scene.add.image(width / 2, 2500, 'tutorial-arrow-down').setOrigin(0.5, 1);
    this.add(this.arrow);
  }
}

export default Step6;
