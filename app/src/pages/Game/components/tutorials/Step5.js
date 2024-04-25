import Phaser from 'phaser';

import TutorialCharacter from './TutorialCharacter';
import Button from '../button/Button';
import configs from '../../configs/configs';

const { width, height } = configs;

const y = 2600;

class Step4 extends Phaser.GameObjects.Container {
  constructor(scene, onNext) {
    super(scene, 0, 0);
    this.coinIcon = scene.add.image(width / 2, y, 'icon-coin-glowing');

    this.setVisible(false);

    this.character = new TutorialCharacter(scene, width / 2, height - 1100, 'tutorial-5', () => {});
    this.add(this.character);

    this.claimButton = new Button(scene, width / 2, y, 'tutorial-5-claim-btn', 'tutorial-5-claim-btn', () => {
      this.startCoinAnimation();
      scene.tutorial.setVisible(false);
      setTimeout(() => {
        scene.game.events.emit('simulator-claim-completed', { amount: 15000 });
        setTimeout(() => {
          scene.tutorial.setVisible(true);
          onNext();
        }, 800);
      }, 2400);
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

export default Step4;
