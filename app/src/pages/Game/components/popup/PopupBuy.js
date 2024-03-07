import Phaser from 'phaser';

import Button from '../button/Button';

const verticalGap = 280;

class PopupBuy extends Phaser.GameObjects.Container {
  goonDisabled = false;
  gangsterDisabled = false;
  houseDisabled = false;
  onClick = () => {};

  constructor(scene, x, y) {
    super(scene, x, y);

    this.popup = scene.add.image(0, 0, 'buy_plane_1').setOrigin(0, 0);
    this.addSafeHouseBtn = new Button(
      scene,
      this.popup.width - 150,
      140,
      'button-buy-safehouse',
      'button-buy-safehouse-pressed',
      () => {
        if (this.houseDisabled) return;
        scene.popupSafeHouseUpgrade.open();
        this.onClick?.();
      },
      { sound: 'open' }
    );
    this.addGangsterBtn = new Button(
      scene,
      this.popup.width - 150,
      this.addSafeHouseBtn.y + verticalGap,
      'button-buy-gangster',
      'button-buy-gangster-pressed',
      () => {
        if (this.gangsterDisabled) return;
        scene.popupBuyGangster.open();
        this.onClick?.();
      },
      { sound: 'open' }
    );
    this.addGoonBtn = new Button(
      scene,
      this.popup.width - 150,
      this.addGangsterBtn.y + verticalGap,
      'button-buy-goon',
      'button-buy-goon-pressed',
      () => {
        if (this.goonDisabled) return;
        scene.popupBuyGoon?.open();
        this.onClick?.();
      },
      { sound: 'open' }
    );

    this.add(this.popup);
    this.add(this.addSafeHouseBtn);
    this.add(this.addGangsterBtn);
    this.add(this.addGoonBtn);
    this.setVisible(false);
  }

  updateDisabled({ goonDisabled, gangsterDisabled, houseDisabled }) {
    this.goonDisabled = goonDisabled;
    this.gangsterDisabled = gangsterDisabled;
    this.houseDisabled = houseDisabled;

    if (houseDisabled) {
      this.addSafeHouseBtn.setAlpha(0.5);
    } else {
      this.addSafeHouseBtn.setAlpha(1);
    }

    if (gangsterDisabled) {
      this.addGangsterBtn.setAlpha(0.5);
    } else {
      this.addGangsterBtn.setAlpha(1);
    }

    if (goonDisabled) {
      this.addGoonBtn.setAlpha(0.5);
    } else {
      this.addGoonBtn.setAlpha(1);
    }
  }

  updateCallback(callback) {
    this.onClick = callback;
  }
}

export default PopupBuy;
