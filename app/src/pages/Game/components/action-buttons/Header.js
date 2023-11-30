import Phaser from 'phaser';

import DailyMoney from './DailyMoney';
import Balance from './Balance';
import configs from '../../configs/configs';
import { formatter, customFormat } from '../../../../utils/numbers';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';

const { width } = configs;

const buttonWidth = 400;
const gap = buttonWidth + 20;

class Header extends Phaser.GameObjects.Container {
  timeout;

  constructor(scene, y) {
    super(scene, 0, 0);

    this.addedAmount = scene.add
      .text(width / 2 + 100, y, '', {
        fontSize: fontSizes.extraLarge,
        color: colors.yellow,
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(0.5, 0);
    this.addedAmount.setStroke(colors.brown, 10);

    this.dailyMoney = new DailyMoney(scene, width / 2 - gap, y, 0);
    this.fiatBalance = new Balance(scene, width / 2, y, () => scene.popupDeposit.open(), 'fiat-balance', 0);
    this.ethBalance = new Balance(scene, width / 2 + gap, y, () => scene.popupDeposit.open(), 'eth-balance', 0);

    this.add(this.dailyMoney);
    this.add(this.fiatBalance);
    this.add(this.ethBalance);

    scene.game.events.on('update-balances', (data) => this.updateValues(data));
    scene.game.events.on('claim-completed', ({ amount }) => {
      console.log('amount', amount);
      this.addedAmount.text = `+${formatter.format(amount)}`;

      scene.tweens.add({
        targets: this.addedAmount,
        y: [y, y + 120],
        alpha: [0, 1],
        duration: 800,
        ease: 'Cubic.out',
        onComplete: () => this.addedAmount.setAlpha(0),
      });
    });

    scene.game.events.emit('request-balances');
  }

  updateValues({ dailyMoney, ETHBalance, tokenBalance }) {
    this.dailyMoney.updateValue(dailyMoney);
    this.fiatBalance.updateValue(customFormat(tokenBalance || 0, 1));
    this.ethBalance.updateValue(formatter.format(ETHBalance));
  }
}

export default Header;
