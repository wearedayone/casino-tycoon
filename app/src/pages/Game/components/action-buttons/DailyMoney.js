import Phaser from 'phaser';

import { formatter } from '../../../../utils/numbers';
import { colors, fontFamilies } from '../../../../utils/styles';

class DailyMoney extends Phaser.GameObjects.Container {
  constructor(scene, x, y, value) {
    super(scene, 0, 0);

    this.container = scene.add.image(x, y, 'daily-money').setOrigin(0.5, 0.5);
    this.valueText = scene.add
      .text(x + 20, y - 10, `+${formatter.format(value)}`, {
        fontSize: '50px',
        fontFamily: fontFamilies.extraBold,
        color: colors.brown,
      })
      .setOrigin(0.5, 0.5);

    this.add(this.container);
    this.add(this.valueText);
  }

  updateValue(newValue) {
    this.valueText.text = `+${formatter.format(newValue)}`;
  }
}

export default DailyMoney;
