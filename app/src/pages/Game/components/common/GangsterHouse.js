import Phaser from 'phaser';

import { formatter } from '../../../../utils/numbers';
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
    this.valueText = scene.add.text(width / 2, this.sign.y - 30, ``, {
      fontSize: '82px',
      fontFamily: 'WixMadeforDisplayExtraBold',
      color: '#fff',
    });

    this.add(this.house);
    this.add(this.sign);
    this.add(this.valueText);

    scene.game.events.on(events.updateNetworth, ({ networth, level }) => {
      this.valueText.text = `${formatter.format(networth)}`;
      if (level) {
        this.house.setTexture(`gangster-house-${level}`);
      }
    });
    scene.game.events.emit(events.requestNetworth);
  }
}

export default GangsterHouse;
