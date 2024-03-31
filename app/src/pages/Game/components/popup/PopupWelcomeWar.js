import Popup from './Popup';
import Button from '../button/Button';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { formatter } from '../../../../utils/numbers';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';

const { width, height } = configs;

class PopupWelcomeWar extends Popup {
  latestWar = {};
  workerBonusMultiple = 0;
  numberOfWorkers = 0;
  numberOfMachinesToEarn = 0;
  tokenEarnFromEarning = 0;
  loading = false;

  constructor(scene, value) {
    super(scene, 'popup-welcome-war', {
      openOnCreate: true,
      destroyWhenClosed: true,
      ribbon: 'ribbon-welcome',
      hasGlow: true,
      onClose: () => scene.game.events.emit('update-last-time-seen-war-result'),
    });

    this.line1Y = height / 2 + 220;
    this.line2Y = this.line1Y + 60;
    this.line3Y = this.line2Y + 40;
    this.reputationY = this.popup.y + this.popup.height / 2 - 235;
    this.numberGap = 370;

    const leftMargin = this.popup.x - this.popup.width / 2;
    const topMargin = this.popup.y - this.popup.height / 2;

    this.valueText = scene.add
      .text(
        leftMargin + this.popup.width * 0.28,
        topMargin + this.popup.height * 0.2,
        `+${formatter.format(value)}\n$GANG`,
        {
          fontSize: '88px',
          color: '#fff',
          fontFamily: fontFamilies.extraBold,
          align: 'center',
        }
      )
      .setOrigin(0.5, 0);
    this.valueText.setStroke(colors.brown, 20);
    this.add(this.valueText);

    this.earnValueText = scene.add
      .text(width / 2 - this.numberGap, this.line1Y, '0', {
        fontSize: '56px',
        color: colors.black,
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false);
    this.add(this.earnValueText);
    this.earnTokenText = scene.add
      .text(width / 2 - this.numberGap, this.line2Y, '$GANG', {
        fontSize: '40px',
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false);
    this.add(this.earnTokenText);
    this.workerBonus = scene.add
      .text(width / 2 - this.numberGap, this.line3Y, '', {
        fontSize: '30px',
        color: colors.brown,
        fontFamily: fontFamilies.bold,
        align: 'center',
      })
      .setOrigin(0.5, 0);
    this.add(this.workerBonus);

    this.defendValueText = scene.add
      .text(width / 2, this.line1Y, '0', {
        fontSize: '56px',
        color: colors.black,
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false);
    this.add(this.defendValueText);
    this.defendTokenText = scene.add
      .text(width / 2, this.line2Y, '$GANG', {
        fontSize: '40px',
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false);
    this.add(this.defendTokenText);
    this.defendNoLossText = scene.add
      .text(width / 2, this.line1Y, 'No Loss', {
        fontSize: '56px',
        color: colors.black,
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false);
    this.add(this.defendNoLossText);

    this.attackValueText = scene.add
      .text(width / 2 + this.numberGap, this.line1Y, '0', {
        fontSize: '56px',
        color: colors.black,
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false);
    this.add(this.attackValueText);
    this.attackTokenText = scene.add
      .text(width / 2 + this.numberGap, this.line2Y, '$GANG', {
        fontSize: '40px',
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false);
    this.add(this.attackTokenText);
    this.attackNoAttackText = scene.add
      .text(width / 2 + this.numberGap, this.line1Y, 'No Attack', {
        fontSize: '56px',
        color: colors.black,
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false);
    this.add(this.attackNoAttackText);
    this.attackLostText = scene.add
      .text(width / 2 + this.numberGap, this.line1Y, 'Lost', {
        fontSize: '56px',
        color: colors.black,
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false);
    this.add(this.attackLostText);
    this.attackLostValueText = scene.add
      .text(width / 2 + this.numberGap - 40, this.line3Y, '0', {
        fontSize: '56px',
        color: colors.black,
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false);
    this.add(this.attackLostValueText);
    this.attackLostIcon = scene.add
      .image(width / 2 + this.numberGap + this.attackLostValueText.width / 2 + 20, this.line3Y, 'icon-gangster-small')
      .setOrigin(0.5, 0.5)
      .setVisible(false);
    this.add(this.attackLostIcon);

    this.reputation = scene.add
      .text(width / 2, this.reputationY, '+0', {
        fontSize: '72px',
        color: colors.black,
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(0, 0.5);
    this.reputationStar = scene.add
      .image(this.reputation.x + this.reputation.width + 30, this.reputationY, 'icon-star-medium')
      .setOrigin(0, 0.5);
    this.add(this.reputation);
    this.add(this.reputationStar);

    scene.game.events.on('update-war-history-latest', (data) => {
      if (!data) return;

      this.reset();
      const {
        tokenEarnFromEarning,
        numberOfMachinesToEarn,
        numberOfWorkers,
        tokenEarnFromAttacking,
        machinesLost,
        tokenStolen,
        attackUserId,
        gainedReputation,
      } = data;

      // earn
      this.earnValueText.text = `+${formatter.format(tokenEarnFromEarning || 0)}`;
      this.earnValueText.setVisible(true);
      this.earnTokenText.setVisible(true);
      this.numberOfWorkers = numberOfWorkers;
      this.numberOfMachinesToEarn = numberOfMachinesToEarn;
      this.tokenEarnFromEarning = tokenEarnFromEarning;
      this.updateWorkerBonus();

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

      // reputation
      this.reputation.text = `+${formatter.format(gainedReputation || 0)}`;
      this.reputationStar.x = this.reputation.x + this.reputation.width + 30;
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
          { sound: 'close', fontSize: '82px' }
        );
        this.add(this.buttonClaim);
      }
    });

    scene.game.events.on('update-war-config', ({ workerBonusMultiple }) => {
      this.workerBonusMultiple = workerBonusMultiple;
      this.updateWorkerBonus();
    });

    scene.game.events.emit('request-war-config');
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

  updateWorkerBonus() {
    const workerBonusUnits = this.workerBonusMultiple * this.numberOfWorkers;
    const tokenPerEarner = this.tokenEarnFromEarning / (this.numberOfMachinesToEarn + workerBonusUnits);
    const bonus = tokenPerEarner * workerBonusUnits;
    this.workerBonus.text = `Including +${formatter.format(bonus)}\nas Goon Bonus`;
    this.workerBonus.setVisible(!!bonus);
  }
}

export default PopupWelcomeWar;
