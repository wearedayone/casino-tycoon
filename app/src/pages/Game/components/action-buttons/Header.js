import Phaser from 'phaser';

import { formatter, customFormat } from '../../../../utils/numbers';
import configs from '../../configs/configs';
import DailyMoney from './DailyMoney';
import Balance from './Balance';

const { width } = configs;

const buttonWidth = 400;
const gap = buttonWidth + 20;

class Header extends Phaser.GameObjects.Container {
  timeout;

  constructor(scene, y) {
    super(scene, 0, 0);

    this.dailyMoney = new DailyMoney(scene, width / 2 - gap, y, 0);
    this.fiatBalance = new Balance(scene, width / 2, y, () => scene.popupBuy.setVisible(true), 'fiat-balance', 0);
    this.ethBalance = new Balance(scene, width / 2 + gap, y, () => scene.popupDeposit.open(), 'eth-balance', 0);

    this.add(this.dailyMoney);
    this.add(this.fiatBalance);
    this.add(this.ethBalance);

    scene.game.events.on('update-balances', (data) => this.updateValues(data));
    scene.game.events.emit('request-balances');
  }

  updateValues({ dailyMoney, ETHBalance, tokenBalance }) {
    this.dailyMoney.updateValue(dailyMoney);
    this.fiatBalance.updateValue(customFormat(tokenBalance || 0, 1));
    this.ethBalance.updateValue(formatter.format(ETHBalance));
  }
}

export default Header;
