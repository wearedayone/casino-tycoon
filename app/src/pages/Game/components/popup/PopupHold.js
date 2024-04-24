import Popup from './Popup';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { formatter } from '../../../../utils/numbers';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';

const { width, height } = configs;

class PopupHold extends Popup {
  constructor(scene) {
    super(scene, 'popup-hold', { title: 'Holding Rewards' });

    const balanceEndX = width / 2 + 305;
    const gangBalanceY = height / 2 + 165;
    const xGangEarnedY = gangBalanceY + 100;
    const dailyXGangY = xGangEarnedY + 60;

    this.gangBalance = scene.add
      .text(balanceEndX, gangBalanceY, '', {
        fontSize: fontSizes.medium,
        color: colors.black,
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(1, 0);
    this.xGangEarned = scene.add
      .text(balanceEndX, xGangEarnedY, '', {
        fontSize: fontSizes.medium,
        color: colors.black,
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(1, 0);
    this.add(this.gangBalance);
    this.add(this.xGangEarned);

    this.xGangDaily = scene.add
      .text(width / 2 - 135, dailyXGangY, '', {
        fontSize: fontSizes.small,
        color: colors.brown,
        fontFamily: fontFamilies.bold,
        align: 'center',
      })
      .setOrigin(0.5, 0);
    this.add(this.xGangDaily);

    this.claimBtn = new TextButton(
      scene,
      width / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      () => {
        scene.game.events.emit('claim-holding-reward-x-token');
        this.close();
      },
      'Claim',
      { fontSize: '82px', sound: 'button-1' }
    );
    this.add(this.claimBtn);

    scene.game.events.on('update-claimable-x-token', ({ tokenBalance, xGangReward, dailyXTokenReward }) => {
      this.gangBalance.text = formatter.format(tokenBalance);
      this.xGangEarned.text = formatter.format(xGangReward);
      this.xGangDaily.text = `(${formatter.format(dailyXTokenReward)} per day)`;
    });

    scene.game.events.emit('request-claimable-x-token');
  }
}

export default PopupHold;
