import Popup from './Popup';
import Button from '../button/Button';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { formatter } from '../../../../utils/numbers';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';

const { width, height } = configs;

class PopupWelcomeWar extends Popup {
  latestWar = {};
  loading = false;

  constructor(scene, value) {
    super(scene, 'popup-welcome-war', {
      openOnCreate: true,
      destroyWhenClosed: true,
      ribbon: 'ribbon-welcome',
      hasGlow: true,
      onClose: () => scene.game.events.emit('update-last-time-seen-war-result'),
    });

    this.line1Y = height / 2 + this.popup.height / 2 - 385;
    this.line2Y = this.line1Y + 80;
    this.numberGap = 370;

    const leftMargin = this.popup.x - this.popup.width / 2;
    const topMargin = this.popup.y - this.popup.height / 2;

    this.valueText = scene.add
      .text(leftMargin + this.popup.width * 0.28, topMargin + this.popup.height * 0.27, `+${formatter.format(value)}`, {
        fontSize: '88px',
        color: '#fff',
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(0.5, 0);
    this.valueText.setStroke(colors.brown, 20);
    this.add(this.valueText);

    this.earnValueText = scene.add
      .text(width / 2 - this.numberGap, this.line1Y, '0', {
        fontSize: '56px',
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false);
    this.add(this.earnValueText);
    this.earnTokenText = scene.add
      .text(width / 2 - this.numberGap, this.line2Y, '$FIAT', {
        fontSize: '56px',
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false);
    this.add(this.earnTokenText);

    this.defendValueText = scene.add
      .text(width / 2, this.line1Y, '0', {
        fontSize: '56px',
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false);
    this.add(this.defendValueText);
    this.defendTokenText = scene.add
      .text(width / 2, this.line2Y, '$FIAT', {
        fontSize: '56px',
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false);
    this.add(this.defendTokenText);
    this.defendNoLossText = scene.add
      .text(width / 2, (this.line1Y + this.line2Y) / 2, 'No Loss', {
        fontSize: '56px',
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false);
    this.add(this.defendNoLossText);

    this.attackValueText = scene.add
      .text(width / 2 + this.numberGap, this.line1Y, '0', {
        fontSize: '56px',
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false);
    this.add(this.attackValueText);
    this.attackTokenText = scene.add
      .text(width / 2 + this.numberGap, this.line2Y, '$FIAT', {
        fontSize: '56px',
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false);
    this.add(this.attackTokenText);
    this.attackNoAttackText = scene.add
      .text(width / 2 + this.numberGap, (this.line1Y + this.line2Y) / 2, 'No Attack', {
        fontSize: '56px',
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false);
    this.add(this.attackNoAttackText);
    this.attackLostText = scene.add
      .text(width / 2 + this.numberGap, this.line1Y, 'Lost', {
        fontSize: '56px',
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false);
    this.add(this.attackLostText);
    this.attackLostValueText = scene.add
      .text(width / 2 + this.numberGap - 35, this.line2Y, '1000', {
        fontSize: '56px',
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false);
    this.add(this.attackLostValueText);
    this.attackLostIcon = scene.add
      .image(width / 2 + this.numberGap + this.attackLostValueText.width / 2 + 20, this.line2Y, 'icon-gangster-mini')
      .setOrigin(0.5, 0.5)
      .setVisible(false);
    this.add(this.attackLostIcon);

    scene.game.events.on('update-war-history-latest', (data) => {
      if (!data) return;

      this.reset();
      const { tokenEarnFromEarning, tokenEarnFromAttacking, machinesLost, tokenStolen, attackUserId } = data;

      // earn
      this.earnValueText.text = `+${formatter.format(tokenEarnFromEarning || 0)}`;
      this.earnValueText.setVisible(true);
      this.earnTokenText.setVisible(true);

      // defend
      if (!tokenStolen) {
        this.defendNoLossText.setVisible(true);
      } else {
        this.defendTokenText.setVisible(true);
        this.defendValueText.text = `-${formatter.format(tokenStolen)}`;
        this.defendValueText.setVisible(true);
      }

      // attack
      if (!attackUserId) {
        this.attackNoAttackText.setVisible(true);
      } else if (!!machinesLost) {
        this.attackLostText.setVisible(true);
        this.attackLostValueText.text = `-${formatter.format(machinesLost)}`;
        this.attackLostValueText.setVisible(true);
        this.attackLostIcon.x = width / 2 + this.numberGap + this.attackLostValueText.width / 2 + 20;
        this.attackLostIcon.setVisible(true);
      } else {
        this.attackTokenText.setVisible(true);
        this.attackValueText.text = `+${formatter.format(tokenEarnFromAttacking)}`;
        this.attackValueText.setVisible(true);
      }
    });

    scene.game.events.on('update-claimable-status', ({ claimable, active }) => {
      if (this.buttonClaim) {
        this.remove(this.buttonClaim);
        this.buttonClaim.destroy(true);
      }
      if (claimable && active) {
        this.buttonClaim = new Button(
          scene,
          width / 2,
          height / 2 + this.popup.height / 2 - 20,
          'button-claim',
          'button-claim-pressed',
          () => {
            if (this.loading) return;
            scene.game.events.emit('claim');
            this.close();
          },
          { sound: 'button-1' }
        );
        this.add(this.buttonClaim);
      } else {
        this.buttonClaim = new TextButton(
          scene,
          width / 2,
          height / 2 + this.popup.height / 2 - 20,
          'button-blue',
          'button-blue-pressed',
          () => this.close(),
          'Back',
          { sound: 'close' }
        );
        this.add(this.buttonClaim);
      }
    });

    scene.game.events.emit('request-war-history-latest');
    scene.game.events.emit('request-claimable-status');
  }

  reset() {
    this.earnValueText.setVisible(false);
    this.earnTokenText.setVisible(false);
    this.defendValueText.setVisible(false);
    this.defendTokenText.setVisible(false);
    this.defendNoLossText.setVisible(false);
    this.attackValueText.setVisible(false);
    this.attackTokenText.setVisible(false);
    this.attackNoAttackText.setVisible(false);
    this.attackLostValueText.setVisible(false);
    this.attackLostText.setVisible(false);
    this.attackLostIcon.setVisible(false);
  }
}

export default PopupWelcomeWar;
