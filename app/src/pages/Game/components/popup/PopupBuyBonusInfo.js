import Popup from './Popup';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';
import { formatter } from '../../../../utils/numbers';

const { width, height } = configs;
const largeBlackBold = { fontSize: fontSizes.large, color: colors.black, fontFamily: fontFamilies.bold };

class PopupBuyBonusInfo extends Popup {
  constructor(scene, parentModal) {
    super(scene, 'popup-small', { title: 'Buy Bonus', titleIcon: 'icon-info' });

    const leftMargin = this.popup.x - this.popup.width / 2;
    this.paddedX = leftMargin + this.popup.width * 0.1;
    const startingY = this.popup.y - this.popup.height / 2;
    const firstParagraphY = startingY + 220;
    const secondParagraphY = firstParagraphY + 400;

    this.reservePoolHidden = scene.add.text(this.paddedX, secondParagraphY, '---', largeBlackBold).setVisible(false);
    this.coinIcon = scene.add
      .image(width / 2 + this.reservePoolHidden.width + 80, secondParagraphY, 'coin')
      .setOrigin(0.5, 0);
    this.reservePool = scene.add.text(
      this.paddedX,
      secondParagraphY,
      'There is currently ---         \n$FIAT in the reserve pool, which \nwill increase with every Goon \nand Safehouse purchase',
      largeBlackBold
    );
    this.bonusPercent = scene.add.text(
      this.paddedX,
      firstParagraphY,
      'Players receive -% of the reserve \npool as a bonus for buying \nGangsters.',
      largeBlackBold
    );
    this.add(this.reservePool);
    this.add(this.coinIcon);
    this.add(this.bonusPercent);

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

    scene.game.events.emit('request-reserve-pool');
    scene.game.events.on('update-reserve-pool', (data) => this.updateData(data));
  }

  updateData({ reservePool, reservePoolReward }) {
    const amount = formatter.format(reservePool);
    this.reservePoolHidden.text = amount;
    this.reservePool.text = `There is currently ${amount}         \n$FIAT in the reserve pool, which \nwill increase with every Goon \nand Safehouse purchase.`;
    this.bonusPercent.text = `Players receive ${
      reservePoolReward * 100
    }% of the reserve\npool as a bonus for buying\nGangsters.`;

    this.coinIcon.setX(width / 2 + this.reservePoolHidden.width + 80);
  }
}

export default PopupBuyBonusInfo;
