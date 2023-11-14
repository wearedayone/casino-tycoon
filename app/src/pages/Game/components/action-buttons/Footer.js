import Phaser from 'phaser';

import Button from '../button/Button';
import configs from '../../configs/configs.json';

const { width } = configs;

const px = 40;
const buttonWidth = 287;

class Footer extends Phaser.GameObjects.Container {
  constructor(scene, y) {
    super(scene, 0, 0);

    this.buttonWar = new Button(scene, buttonWidth / 2 + px, y, 'button-war', 'button-war-pressed', () =>
      console.log('btn war clicked')
    );

    this.buttonBuy = new Button(scene, width - px - buttonWidth / 2, y, 'button-buy', 'button-buy-pressed', () =>
      console.log('btn buy clicked')
    );

    this.buttonClaim = new Button(scene, width / 2, y, 'button-claim', 'button-claim-pressed', () =>
      console.log('btn claim clicked')
    );

    this.add(this.buttonWar);
    this.add(this.buttonBuy);
    this.add(this.buttonClaim);
  }
}

export default Footer;
