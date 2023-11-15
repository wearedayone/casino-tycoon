import Phaser from 'phaser';

import { formatter } from '../../../../utils/numbers';
import configs from '../../configs/configs.json';

const { width } = configs;

class GangsterHouse extends Phaser.GameObjects.Container {
  constructor(scene, y, level) {
    super(scene, 0, 0);

    const houseImg = `gangster-house-${level}`;
    this.house = scene.add.image(width / 2, y, houseImg).setOrigin(0.5, 0.5);

    this.sign = scene.add.image(width / 2, y, 'gangster-house-sign').setOrigin(0.5, 0.5);
    this.valueText = scene.add.text(width / 2, this.sign.y - 30, ``, {
      fontSize: '82px',
      fontFamily: 'WixMadeforDisplayExtraBold',
      color: '#fff',
    });

    this.add(this.house);
    this.add(this.sign);
    this.add(this.valueText);

    scene.game.events.on('update-networth', ({ networth }) => {
      this.valueText.text = `${formatter.format(networth)}`;
    });
    scene.game.events.emit('request-networth');
  }
}

export default GangsterHouse;