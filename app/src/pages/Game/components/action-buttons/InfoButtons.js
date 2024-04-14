import Phaser from 'phaser';

import Button from '../button/Button';
import RankButton from './RankButton';
import configs from '../../configs/configs';
import { fontFamilies } from '../../../../utils/styles';

const { width } = configs;

const px = 40;
const buttonSize = 186;
const verticalGap = buttonSize + 50;

class InfoButtons extends Phaser.GameObjects.Container {
  constructor(scene, y, { isSimulator } = {}) {
    super(scene, 0, 0);

    this.scene = scene;

    const events = {
      requestBadgeNumber: isSimulator ? 'simulator-request-badge-number' : 'request-badge-number',
      updateBadgeNumber: isSimulator ? 'simulator-update-badge-number' : 'update-badge-number',
    };

    this.settingButton = new Button(
      scene,
      buttonSize / 2 + px,
      y,
      'button-setting',
      'button-setting-pressed',
      () => {
        if (isSimulator) return;
        scene.popupSettings?.open();
      },
      { sound: 'button-1' }
    );

    this.referralButton = new Button(
      scene,
      buttonSize / 2 + px,
      y + verticalGap,
      'button-referral',
      'button-referral-pressed',
      () => {
        if (isSimulator) return;
        this.togglePopupReward();
      },
      { sound: 'button-1' }
    );
    this.rankButton = new RankButton(
      scene,
      width - px - buttonSize / 2,
      y,
      'button-rank',
      'button-rank-pressed',
      () => {
        if (isSimulator) return;
        scene.popupLeaderboard?.open();
      },
      { sound: 'button-1', isSimulator }
    );
    this.portfolioButton = new Button(
      scene,
      width - px - buttonSize / 2,
      y + verticalGap,
      'button-portfolio',
      'button-portfolio-pressed',
      () => {
        if (isSimulator) return;
        scene.popupPortfolio?.open();
      },
      { sound: 'button-1' }
    );

    this.badge = scene.add
      .image(
        this.referralButton.x + this.referralButton.width / 2 - 10,
        this.referralButton.y - this.referralButton.height / 2 + 10,
        'badge'
      )
      .setOrigin(0.5, 0.5);

    this.badgeText = scene.add
      .text(this.badge.x, this.badge.y, '0', { fontFamily: fontFamilies.extraBold, fontSize: '46px', color: '#fff' })
      .setOrigin(0.5, 0.5);

    this.popupReward = scene.add
      .image(
        this.referralButton.x - this.referralButton.width / 2,
        this.referralButton.y - this.referralButton.height / 2,
        'popup-reward'
      )
      .setOrigin(0, 0);

    const centerX = this.popupReward.x + this.popupReward.width / 2;
    const handShakeIconY = this.popupReward.y + this.popupReward.height / 2 - 100;
    this.handShakeIcon = scene.add.image(centerX, handShakeIconY, 'hand-shake').setOrigin(0.5, 0.5);
    this.handShakeText = scene.add
      .text(centerX, this.handShakeIcon.y + this.handShakeIcon.height / 2 + 50, 'Referrals', {
        fontFamily: fontFamilies.extraBold,
        fontSize: '46px',
        color: '#fff',
      })
      .setOrigin(0.5, 0.5);
    this.handShakeText.setStroke('#6F0132', 10);

    this.handShakeIcon.setInteractive().on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      this.openReferralPopup();
    });
    this.handShakeText.setInteractive().on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      this.openReferralPopup();
    });

    this.dailySpinIcon = scene.add.image(centerX, this.handShakeText.y + 150, 'daily-spin').setOrigin(0.5, 0.5);
    this.dailySpinText = scene.add
      .text(centerX, this.dailySpinIcon.y + this.dailySpinIcon.height / 2 + 50, 'Daily Spin', {
        fontFamily: fontFamilies.extraBold,
        fontSize: '46px',
        color: '#fff',
      })
      .setOrigin(0.5, 0.5);
    this.dailySpinText.setStroke('#6F0132', 10);

    this.dailySpinIcon.setInteractive().on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      this.openDailySpinPopup();
    });
    this.dailySpinText.setInteractive().on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      this.openDailySpinPopup();
    });

    this.hideBadge();
    this.hidePopupReward();

    this.add(this.popupReward);
    this.add(this.handShakeIcon);
    this.add(this.handShakeText);
    this.add(this.dailySpinIcon);
    this.add(this.dailySpinText);

    this.add(this.settingButton);
    this.add(this.referralButton);
    this.add(this.rankButton);
    this.add(this.portfolioButton);
    this.add(this.badge);
    this.add(this.badgeText);

    scene.game.events.on(events.updateBadgeNumber, ({ numberOfSpins }) => {
      if (!numberOfSpins) {
        this.hideBadge();
        return;
      }

      this.badgeText.text = `${numberOfSpins}`;
      this.showBadge();
    });
    scene.game.events.emit(events.requestBadgeNumber);
  }

  hideBadge() {
    if (this.badge) {
      this.badge.setVisible(false);
      this.badgeText.setVisible(false);
    }
  }

  showBadge() {
    if (this.badge) {
      this.badge.setVisible(true);
      this.badgeText.setVisible(true);
    }
  }

  hidePopupReward() {
    if (this.popupReward) {
      this.popupReward.setVisible(false);
      this.handShakeIcon?.setVisible(false);
      this.handShakeText?.setVisible(false);
      this.dailySpinIcon?.setVisible(false);
      this.dailySpinText?.setVisible(false);
    }
  }

  showPopupReward() {
    if (this.popupReward) {
      this.popupReward.setVisible(true);
      this.handShakeIcon?.setVisible(true);
      this.handShakeText?.setVisible(true);
      this.dailySpinIcon?.setVisible(true);
      this.dailySpinText?.setVisible(true);
    }
  }

  togglePopupReward() {
    if (this.popupReward?.visible) {
      this.hidePopupReward();
    } else {
      this.showPopupReward();
    }
  }

  openReferralPopup() {
    this.hidePopupReward();
    this.scene.popupReferralProgram?.open();
  }

  openDailySpinPopup() {
    this.hidePopupReward();
    this.scene.popupDailySpin?.open();
  }
}

export default InfoButtons;
