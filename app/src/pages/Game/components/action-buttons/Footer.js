import Phaser from 'phaser';

import Button from '../button/Button';
import configs from '../../configs/configs';
import DisabledClaimButton from '../button/DiabledClaimButton';
import ActiveClaimButton from '../button/ActiveClaimButton';
import ClaimButton from '../button/ClaimButton';

const { width } = configs;

const px = 40;
const buttonWidth = 288;

class Footer extends Phaser.GameObjects.Container {
  constructor(scene, y) {
    super(scene, 0, 0);

    this.buttonWar = new Button(
      scene,
      buttonWidth / 2 + px,
      y,
      'button-war',
      'button-war-pressed',
      () => {
        scene.popupBuy.setVisible(false);
        scene.popupWar.setVisible(!scene.popupWar.visible);
      },
      { sound: 'button-1' }
    );

    this.buttonBuy = new Button(
      scene,
      width - px - buttonWidth / 2,
      y,
      'button-buy',
      'button-buy-pressed',
      () => {
        scene.popupWar.setVisible(false);
        scene.popupBuy.setVisible(!scene.popupBuy.visible);
      },
      { sound: 'button-1' }
    );

    this.buttonClaim = new ClaimButton(scene, width / 2, y);

    this.add(this.buttonWar);
    this.add(this.buttonBuy);
    this.add(this.buttonClaim);
  }
}

export default Footer;
