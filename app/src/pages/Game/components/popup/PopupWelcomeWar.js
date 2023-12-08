import Popup from './Popup';
import Button from '../button/Button';
import configs from '../../configs/configs';
import { formatter } from '../../../../utils/numbers';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';

const { width, height } = configs;

class PopupWelcomeWar extends Popup {
  latestWar = {};

  constructor(scene, value) {
    super(scene, 'popup-welcome-war', {
      openOnCreate: true,
      destroyWhenClosed: true,
      ribbon: 'ribbon-welcome',
      hasGlow: true,
    });

    const leftMargin = this.popup.x - this.popup.width / 2;
    const topMargin = this.popup.y - this.popup.height / 2;
    const outcomeTextY = topMargin + this.popup.height - 280;

    this.buttonClaim = new Button(
      scene,
      width / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-claim',
      'button-claim-pressed',
      () => console.log('claim btn clicked'),
      { sound: 'button-1' }
    );
    this.add(this.buttonClaim);

    this.valueText = scene.add
      .text(leftMargin + this.popup.width * 0.25, topMargin + this.popup.height * 0.3, `+${formatter.format(value)}`, {
        fontSize: '88px',
        color: '#fff',
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(0.5, 0);
    this.valueText.setStroke(colors.brown, 20);
    this.add(this.valueText);

    this.outcomeText = scene.add
      .text(width / 2, outcomeTextY, ``, {
        fontSize: fontSizes.medium,
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0);
    this.add(this.outcomeText);

    this.outcomeBonusAmount = scene.add
      .text(width / 2, outcomeTextY, '+0', {
        fontSize: fontSizes.medium,
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0)
      .setVisible(false);
    this.outcomeIconCoin = scene.add
      .image(width / 2, outcomeTextY, 'icon-coin-mini')
      .setOrigin(0.5, 0.2)
      .setVisible(false);
    this.add(this.outcomeBonusAmount);
    this.add(this.outcomeIconCoin);

    const iconGangsterX = width / 2 + 40;
    this.outcomeIconGangster = scene.add
      .image(iconGangsterX, outcomeTextY, 'icon-gangster-mini')
      .setOrigin(0.5, 0.2)
      .setVisible(false);
    this.outcomeIconGoon = this.scene.add
      .image(iconGangsterX + 150, outcomeTextY, 'icon-goon-mini')
      .setOrigin(0.5, 0.2)
      .setVisible(false);
    this.add(this.outcomeIconGangster);
    this.add(this.outcomeIconGoon);

    scene.game.events.on('update-war-history', (data = []) => {
      if (!data.length) return;

      this.latestWar = data[0];
      console.log('this.latestWar', this.latestWar);
      const { bonus, penalty } = this.latestWar;
      const hasNoPenalties = Number(penalty?.gangster) + Number(penalty?.goon) === 0;

      if (bonus) {
        this.outcomeText.text = `You gained +${formatter.format(bonus)}            Bonus.`;
        this.outcomeBonusAmount.text = `+${formatter.format(bonus)}`;
        this.outcomeIconCoin.setX(width / 2 + this.outcomeBonusAmount.width / 2 + 50);
      } else {
        if (hasNoPenalties) this.outcomeText.text = `Your gang escaped. Nothing was lost.`;
        else {
          this.outcomeText.text = `You lost -${Number(penalty?.gangster)}            -${Number(
            penalty?.goon
          )}            `;
        }
      }

      this.outcomeBonusAmount.setVisible(bonus);
      this.outcomeIconCoin.setVisible(bonus);
      this.outcomeIconGangster.setVisible(!bonus && !hasNoPenalties);
      this.outcomeIconGoon.setVisible(!bonus && !hasNoPenalties);
    });
    scene.game.events.emit('request-war-history');
  }
}

export default PopupWelcomeWar;
