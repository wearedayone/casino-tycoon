import Phaser from 'phaser';

import configs from '../../configs/configs';
import Button from '../button/Button';
import TutorialCharacter from './TutorialCharacter';

const { width, height } = configs;

const y = 2600;

class Step6 extends Phaser.GameObjects.Container {
  scene;

  constructor(scene, onNext) {
    super(scene, 0, 0);
    this.scene = scene;
    this.coinIcon = scene.add.image(width / 2, y, 'icon-coin-glowing');

    this.setVisible(false);

    this.character = new TutorialCharacter(scene, width / 2, height / 2 + 200, 'tutorial-6', onNext);
    this.add(this.character);

    this.claimButtonLight = scene.add.image(width / 2, y, 'tutorial-6-claim-btn-light').setOrigin(0.5, 0.5);
    this.add(this.claimButtonLight);

    this.claimButton = new Button(scene, width / 2, y, 'tutorial-6-claim-btn', 'tutorial-6-claim-btn', () => {
      this.startCoinAnimation();
      scene.tutorial.setVisible(false);
      setTimeout(() => {
        scene.tutorial.setVisible(true);
        scene.game.events.emit('simulator-claim-completed', { amount: 15000 });
        onNext();
      }, 3000);
    });
    this.add(this.claimButton);

    this.arrow = scene.add.image(width / 2, 2500, 'tutorial-arrow-down').setOrigin(0.5, 1);
    this.add(this.arrow);
  }

  startCoinAnimation() {
    this.scene.tweens.add({
      targets: this.coinIcon,
      x: [
        width / 2 + 80,
        width / 2 + 120,
        width / 2 + 120,
        width / 2 + 100,
        width / 2 + 50,
        width / 2,
        width / 2 - 140,
      ],
      y: [y, height * 0.7, height / 2, height * 0.35, height * 0.2, height * 0.15, 250],
      duration: 2400,
      ease: 'Cubic.out',
      interpolation: 'bezier', // turn the points into curve
      hideOnComplete: true,
    });
  }
}

export default Step6;
