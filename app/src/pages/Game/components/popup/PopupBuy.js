import Phaser from 'phaser';

import Button from '../button/Button';

const verticalGap = 280;

class PopupBuy extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);

    this.popup = scene.add.image(0, 0, 'buy_plane_1').setOrigin(0, 0);
    this.addSafeHouseBtn = new Button(
      scene,
      this.popup.width - 150,
      140,
      'button-buy-safehouse',
      'button-buy-safehouse-pressed',
      () => scene.popupSafeHouseUpgrade.setVisible(true),
      { sound: 'open' }
    );
    this.addGangsterBtn = new Button(
      scene,
      this.popup.width - 150,
      this.addSafeHouseBtn.y + verticalGap,
      'button-buy-gangster',
      'button-buy-gangster-pressed',
      () => scene.popupBuyGangster.setVisible(true),
      { sound: 'open' }
    );
    this.addGoonBtn = new Button(
      scene,
      this.popup.width - 150,
      this.addGangsterBtn.y + verticalGap,
      'button-buy-goon',
      'button-buy-goon-pressed',
      () => scene.popupBuyGoon.setVisible(true),
      { sound: 'open' }
    );

    this.add(this.popup);
    this.add(this.addSafeHouseBtn);
    this.add(this.addGangsterBtn);
    this.add(this.addGoonBtn);
    this.setVisible(false);
  }
}

export default PopupBuy;
