import Phaser from 'phaser';

import Button from '../button/Button';
import configs from '../../configs/configs.json';

class Popup extends Phaser.GameObjects.Container {
  constructor(scene, img = 'popup', ribbon, noCloseBtn = false) {
    super(scene, 0, 0);

    this.background = scene.add.rectangle(0, 0, configs.width, configs.height, 0x000000, 0.4).setOrigin(0, 0);
    this.popup = scene.add.image(configs.width / 2, configs.height / 2, img).setOrigin(0.5, 0.5);
    this.add(this.background);
    this.add(this.popup);

    if (!noCloseBtn) {
      this.closeButton = new Button(
        scene,
        configs.width / 2 + this.popup.width / 2 - 50,
        configs.height / 2 - this.popup.height / 2 + 50,
        'button-close',
        'button-close-pressed',
        () => this.destroy(true)
      );
      this.add(this.closeButton);
    }

    if (ribbon) {
      this.ribbon = scene.add
        .image(configs.width / 2, configs.height / 2 - this.popup.height / 2, ribbon)
        .setOrigin(0.5, 0.5);
      this.add(this.ribbon);
    }
  }
}

export default Popup;
