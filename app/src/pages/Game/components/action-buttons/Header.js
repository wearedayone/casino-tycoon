import Phaser from 'phaser';

import { formatter, customFormat } from '../../../../utils/numbers';
import configs from '../../configs/configs.json';
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
    this.ethBalance = new Balance(scene, width / 2, y, 'eth-balance', 0);
    this.fiatBalance = new Balance(scene, width / 2 + gap, y, 'fiat-balance', 0);

    this.add(this.dailyMoney);
    this.add(this.ethBalance);
    this.add(this.fiatBalance);

    scene.game.events.on('update-balances', (data) => this.updateValues(data));
    scene.game.events.emit('request-balances');
  }

  updateValues({ dailyMoney, ETHBalance, tokenBalance }) {
    this.dailyMoney.updateValue(dailyMoney);
    this.ethBalance.updateValue(formatter.format(ETHBalance));
    this.fiatBalance.updateValue(customFormat(tokenBalance || 0, 1));
  }
}

export default Header;
