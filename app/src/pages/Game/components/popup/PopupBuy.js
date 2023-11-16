import Phaser from 'phaser';

import Button from '../button/Button';

const verticalGap = 280;

class PopupBuy extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);

    this.popup = scene.add.image(0, 0, 'popup-buy').setOrigin(0, 0);
    this.addSafeHouseBtn = new Button(
      scene,
      this.popup.width - 70,
      160,
      'button-add',
      'button-add-pressed',
      () => scene.popupSafeHouseUpgrade.setVisible(true),
      'open'
    );
    this.addGangsterBtn = new Button(
      scene,
      this.popup.width - 70,
      this.addSafeHouseBtn.y + verticalGap,
      'button-add',
      'button-add-pressed',
      () => scene.popupBuyGangster.setVisible(true),
      'open'
    );
    this.addGoonBtn = new Button(
      scene,
      this.popup.width - 70,
      this.addGangsterBtn.y + verticalGap,
      'button-add',
      'button-add-pressed',
      () => scene.popupBuyGoon.setVisible(true),
      'open'
    );

    this.add(this.popup);
    this.add(this.addSafeHouseBtn);
    this.add(this.addGangsterBtn);
    this.add(this.addGoonBtn);
    this.setVisible(false);
  }
}

export default PopupBuy;
