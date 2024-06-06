import Phaser from 'phaser';

import { formatter, customFormat } from '../../../../utils/numbers';
import configs from '../../configs/configs';

const { width } = configs;

class GangsterHouse extends Phaser.GameObjects.Container {
  constructor(scene, y, { isSimulator } = {}) {
    super(scene, 0, 0);

    const events = {
      updateNetworth: isSimulator ? 'simulator-update-networth' : 'update-networth',
      requestNetworth: isSimulator ? 'simulator-request-networth' : 'request-networth',
    };

    this.house = scene.add.sprite(width / 2, y, '').setOrigin(0.5, 0.5);

    this.sign = scene.add.image(width / 2, y, 'gangster-house-sign').setOrigin(0.5, 0.5);
    this.valueText = scene.add
      .text(width / 2 + 90, this.sign.y + 20, ``, {
        fontSize: '82px',
        fontFamily: 'WixMadeforDisplayExtraBold',
        color: '#fff',
      })
      .setOrigin(0.5, 0.5);
    this.valueText.setStroke('#3D145F', 12);

    this.add(this.house);
    this.add(this.sign);
    this.add(this.valueText);

    scene.game.events.on(events.updateNetworth, ({ networth, level }) => {
      this.valueText.text = networth < 10000 ? `${networth}` : `${customFormat(networth, 2)}`;
      if (level) {
        this.house.setTexture(`gangster-house-${level}`);
      }
    });
    scene.game.events.emit(events.requestNetworth);
  }
}

export default GangsterHouse;
