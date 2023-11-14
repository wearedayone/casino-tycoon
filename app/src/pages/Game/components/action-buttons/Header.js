import Phaser from 'phaser';

import configs from '../../configs/configs.json';
import DailyMoney from './DailyMoney';
import Balance from './Balance';

const { width } = configs;

const buttonWidth = 400;
const gap = buttonWidth + 20;

class Header extends Phaser.GameObjects.Container {
  constructor(scene, y) {
    super(scene, 0, 0);

    this.dailyMoney = new DailyMoney(scene, width / 2 - gap, y, '10k');
    this.ethBalance = new Balance(scene, width / 2, y, 'eth-balance', '10k');
    this.fiatBalance = new Balance(scene, width / 2 + gap, y, 'fiat-balance', '10k');

    this.add(this.dailyMoney);
    this.add(this.ethBalance);
    this.add(this.fiatBalance);
  }
}

export default Header;
