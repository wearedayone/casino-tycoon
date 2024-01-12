import Popup from './Popup';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';
import { formatter } from '../../../../utils/numbers';

const { width, height } = configs;
const largeBlackBold = { fontSize: fontSizes.large, color: colors.black, fontFamily: fontFamilies.bold };

class PopupBuyBonusInfo extends Popup {
  constructor(scene, parentModal, { isSimulator } = {}) {
    super(scene, 'popup-small', { title: 'Buy Bonus', titleIcon: 'icon-info' });

    const events = {
      updateBuyBonus: isSimulator ? 'simulator-update-buy-bonus' : 'update-buy-bonus',
      requestBuyBonus: isSimulator ? 'simulator-request-buy-bonus' : 'request-buy-bonus',
    };

    this.events = events;

    const leftMargin = this.popup.x - this.popup.width / 2;
    this.paddedX = leftMargin + this.popup.width * 0.1;
    const startingY = this.popup.y - this.popup.height / 2;
    const firstParagraphY = startingY + 320;
    const secondParagraphY = firstParagraphY + 400;

    this.bonusAmountHidden = scene.add.text(this.paddedX, secondParagraphY, '---', largeBlackBold).setVisible(false);
    const staticCoin = scene.add.image(width / 2 - 120, firstParagraphY, 'coin2').setOrigin(0.5, 0);
    this.coinIcon = scene.add
      .image(width / 2 + this.bonusAmountHidden.width + 20, secondParagraphY, 'coin2')
      .setOrigin(0.5, 0);
    this.staticText = scene.add.text(
      this.paddedX,
      firstParagraphY,
      'Get bonus         $FIAT as if you\nbought Gangsters at game launch',
      largeBlackBold
    );
    this.bonusAmount = scene.add.text(
      this.paddedX,
      secondParagraphY,
      'Current bonus: ---         $FIAT',
      largeBlackBold
    );
    this.add(this.staticText);
    this.add(staticCoin);
    this.add(this.coinIcon);
    this.add(this.bonusAmount);

    this.buttonBack = new TextButton(
      scene,
      width / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      () => {
        this.close();
        parentModal.open();
      },
      'Back',
      { fontSize: '82px', sound: 'close' }
    );
    this.add(this.buttonBack);

    scene.game.events.on(events.updateBuyBonus, (data) => this.updateData(data));
  }

  onOpen() {
    this.scene.game.events.emit(this.events.requestBuyBonus);
  }

  updateData({ daysElapsed, gangsterDailyReward }) {
    const amount = formatter.format(daysElapsed * gangsterDailyReward);
    console.log({ daysElapsed, gangsterDailyReward, amount });
    this.bonusAmountHidden.text = amount;
    this.bonusAmount.text = `Current bonus: ${amount}         $FIAT`;

    this.coinIcon.setX(width / 2 + this.bonusAmountHidden.width + 20);
  }
}

export default PopupBuyBonusInfo;
