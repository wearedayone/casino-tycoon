import Phaser from 'phaser';

import Balance from './Balance';
import configs from '../../configs/configs';
import { formatter, customFormat } from '../../../../utils/numbers';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';

const { width } = configs;

const buttonWidth = 400;
const gap = buttonWidth + 20;

class Header extends Phaser.GameObjects.Container {
  timeout;
  headerY = 0;
  xGangBalance = 0;

  constructor(scene, y, { isSimulator } = {}) {
    super(scene, 0, 0);

    const events = {
      updateBalanes: isSimulator ? 'simulator-update-balances' : 'update-balances',
      claimCompleted: isSimulator ? 'simulator-claim-completed' : 'claim-completed',
      requestBalances: isSimulator ? 'simulator-request-balances' : 'request-balances',
      requestXTokenBalance: isSimulator ? 'simulator-request-xtoken-balance' : 'request-xtoken-balance',
      updateXTokenBalance: isSimulator ? 'simulator-update-xtoken-balance' : 'update-xtoken-balance',
    };

    this.headerY = y;

    this.addedAmountXGang = scene.add
      .text(width / 2 - gap + 100, y, '', {
        fontSize: fontSizes.medium,
        color: '#389d2a',
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(0.5, 0);
    this.addedAmountXGang.setStroke('#fff', 10);
    this.addedAmount = scene.add
      .text(width / 2 + 100, y, '', {
        fontSize: fontSizes.extraLarge,
        color: colors.yellow,
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(0.5, 0);
    this.addedAmount.setStroke(colors.brown, 10);

    this.xTokenBalance = new Balance(scene, width / 2 - gap, y, () => scene.popupBuyGoon?.open(), 'xgang-balance', 0);
    this.fiatBalance = new Balance(scene, width / 2, y, () => scene.popupSwap?.open(), 'fiat-balance', 0);
    this.ethBalance = new Balance(scene, width / 2 + gap, y, () => scene.popupDeposit.open(), 'eth-balance', 0);

    this.add(this.xTokenBalance);
    this.add(this.fiatBalance);
    this.add(this.ethBalance);

    scene.game.events.on(events.updateBalanes, (data) => this.updateValues(data));
    scene.game.events.on(events.claimCompleted, ({ amount }) => {
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

    scene.game.events.on(events.updateXTokenBalance, (data) => this.updateXTokenBalance(data));

    scene.game.events.emit(events.requestBalances);
    scene.game.events.emit(events.requestXTokenBalance);
  }

  updateValues({ ETHBalance, tokenBalance }) {
    this.fiatBalance.updateValue(customFormat(tokenBalance || 0, 1));
    this.ethBalance.updateValue(formatter.format(ETHBalance));
  }

  updateXTokenBalance({ balance }) {
    this.xTokenBalance.updateValue(customFormat(balance || 0, 1));
    if (this.xGangBalance && balance - this.xGangBalance > 0) {
      this.addedAmountXGang.text = `+${customFormat(balance - this.xGangBalance, 1)}`;
      this.scene.tweens.add({
        targets: this.addedAmountXGang,
        y: [this.headerY, this.headerY + 120],
        alpha: [0, 1],
        duration: 800,
        ease: 'Cubic.out',
        onComplete: () => this.addedAmountXGang.setAlpha(0),
      });
    }
    this.xGangBalance = balance;
  }
}

export default Header;
