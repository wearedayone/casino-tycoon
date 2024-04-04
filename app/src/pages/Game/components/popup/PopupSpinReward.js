import Phaser from 'phaser';

import Button from '../button/Button';
import configs from '../../configs/configs';
import { fontFamilies } from '../../../../utils/styles';

class PopupSpinReward extends Phaser.GameObjects.Container {
  destroyWhenClosed = false;
  iconY = configs.height / 2 + 50;
  iconX = configs.width / 2;

  constructor(scene) {
    super(scene, 0, 0);
    this.setVisible(false);

    this.sound = scene.sound.add('spin-result-sound', { loop: false });

    this.background = scene.add.rectangle(0, 0, configs.width, configs.height, 0x000000, 0.4).setOrigin(0, 0);
    this.add(this.background);

    this.glowFx = scene.add.image(this.iconX, this.iconY, 'spin-reward-glow-fx').setOrigin(0.5, 0.5);
    this.add(this.glowFx);

    this.icon = scene.add.sprite(this.iconX, this.iconY, '').setOrigin(0.5, 0.5);
    this.add(this.icon);

    this.wonText = scene.add
      .text(this.iconX, this.iconY, 'YOU HAVE WON', {
        fontSize: '64px',
        fontFamily: fontFamilies.extraBold,
        color: '#fff',
      })
      .setOrigin(0.5, 0.5);
    this.wonText.setStroke('#591C9A', 10);
    this.add(this.wonText);

    this.amountText = scene.add
      .text(this.iconX, this.iconY, '0', { fontSize: '116px', fontFamily: fontFamilies.extraBold, color: '#FFDD1D' })
      .setOrigin(0.5, 0.5);
    this.amountText.setStroke('#591C9A', 15);
    this.add(this.amountText);

    this.rewardText = scene.add
      .text(this.iconX, this.iconY, '0', { fontSize: '116px', fontFamily: fontFamilies.extraBold, color: '#fff' })
      .setOrigin(0.5, 0.5);
    this.rewardText.setStroke('#591C9A', 15);
    this.add(this.rewardText);

    this.claimBtn = new Button(
      scene,
      this.iconX,
      this.iconY,
      'button-spin-claim',
      'button-spin-claim-pressed',
      this.close,
      { sound: 'close' }
    );
    this.add(this.claimBtn);

    this.scene = scene;
  }

  /* effects */
  // override to run effects after opening popup
  onOpen() {}
  // override to run effects before closing popup
  cleanup() {}

  open() {
    this.setVisible(true);
    this.sound.play();
  }

  close = () => {
    this.setVisible(false);
    this.sound.stop();
  };

  showReward({ type, value }) {
    const icon = type === 'house' ? 'spin-reward-house' : 'spin-reward-point';
    const reward = type === 'house' ? 'Safehouses' : '$GANG';

    this.icon.setTexture(icon);

    this.amountText.text = `${value}`;
    this.rewardText.text = reward;

    this.wonText.y = this.iconY + this.icon.height / 2 + 80;
    this.amountText.y = this.wonText.y + 100;
    this.rewardText.y = this.amountText.y;
    this.claimBtn.y = this.rewardText.y + 300;

    this.amountText.x -= this.rewardText.width / 2 + 10;
    this.rewardText.x = this.amountText.x + this.amountText.width / 2 + this.rewardText.width / 2 + 20;

    this.open();
  }
}

export default PopupSpinReward;
