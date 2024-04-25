import Phaser from 'phaser';

import TutorialCharacter from './TutorialCharacter';
import configs from '../../configs/configs';

const { width, height } = configs;

class Step2 extends Phaser.GameObjects.Container {
  openTimeout = null;

  constructor(scene, onNext) {
    super(scene, 0, 0);

    this.setVisible(false);

    const next = () => {
      scene.popupLeaderboard.close();
      scene.tutorial.background.setVisible(true);
      scene.tutorial.leftBg?.destroy();
      scene.tutorial.rightBg?.destroy();

      onNext();
    };

    this.overlay = scene.add.image(width / 2, height / 2 + 20, 'tutorial-2-overlay');
    this.add(this.overlay);
    this.character = new TutorialCharacter(scene, width / 2, height - 650, 'tutorial-2', next);
    this.add(this.character);
  }

  start() {
    // wait for rexUI plugin loader to finish
    if (!this.scene.popupLeaderboard) {
      if (this.openTimeout) clearTimeout(this.openTimeout);
      this.openTimeout = setTimeout(() => this.start(), 200);
      return;
    }

    this.setVisible(true);

    // effects
    this.scene.popupLeaderboard.open();
    this.scene.popupLeaderboard.setDepth(1);
    this.scene.popupLeaderboard.background?.destroy();
    this.scene.tutorial.background.setVisible(false);

    const overlayWidth = this.overlay.width * 0.92;
    if (overlayWidth < width) {
      const sidePieceWidth = (width - overlayWidth) / 2;
      this.scene.tutorial.leftBg = this.scene.add
        .rectangle(0, 0, sidePieceWidth, height, 0x260343, 0.8)
        .setOrigin(0, 0)
        .setDepth(1);
      this.scene.tutorial.rightBg = this.scene.add
        .rectangle(width, 0, sidePieceWidth, height, 0x260343, 0.8)
        .setOrigin(1, 0)
        .setDepth(1);
      this.scene.add.existing(this.scene.tutorial.leftBg);
      this.scene.add.existing(this.scene.tutorial.rightBg);
    }
  }
}

export default Step2;
