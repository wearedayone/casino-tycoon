import Phaser from 'phaser';

import Button from '../button/Button';
import RankButton from './RankButton';
import configs from '../../configs/configs';
import { fontFamilies } from '../../../../utils/styles';

const { width, height } = configs;

const px = 40;
const buttonSize = 186;
const verticalGap = buttonSize + 50;

class InfoButtons extends Phaser.GameObjects.Container {
  numberOfSpins = 0;

  constructor(
    scene,
    y,
    {
      isSimulator,
      noBackground = false,
      hideSettings = false,
      hideLeaderboard = false,
      hidePortfolio = false,
      dailySpinDisabled = false,
      holdingRewardDisabled = false,
      onClickReward,
    } = {}
  ) {
    super(scene, 0, 0);

    this.scene = scene;

    const events = {
      requestBadgeNumber: isSimulator ? 'simulator-request-badge-number' : 'request-badge-number',
      updateBadgeNumber: isSimulator ? 'simulator-update-badge-number' : 'update-badge-number',
    };

    if (!hideSettings) {
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
      this.add(this.settingButton);
    }

    this.rewardButton = new Button(
      scene,
      buttonSize / 2 + px,
      y + verticalGap,
      'button-reward',
      'button-reward-pressed',
      () => {
        if (isSimulator) return;
        // within simulator
        if (onClickReward) {
          onClickReward();
          this.showPopupReward();
          return;
        }
        this.togglePopupReward();
      },
      { sound: 'button-1' }
    );

    if (!hideLeaderboard) {
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
      this.add(this.rankButton);
    }

    if (!hidePortfolio) {
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
      this.add(this.portfolioButton);
    }

    this.badge = scene.add
      .image(
        this.rewardButton.x + this.rewardButton.width / 2 - 10,
        this.rewardButton.y - this.rewardButton.height / 2 + 10,
        'badge'
      )
      .setOrigin(0.5, 0.5);

    this.badgeText = scene.add
      .text(this.badge.x, this.badge.y, '0', { fontFamily: fontFamilies.extraBold, fontSize: '46px', color: '#fff' })
      .setOrigin(0.5, 0.5);

    this.arrow = scene.add
      .sprite(this.rewardButton.x, this.rewardButton.y + this.rewardButton.height / 2, 'arrow-down-gold')
      .setOrigin(0.5, 0.5);

    this.referralButton = new Button(
      scene,
      buttonSize / 2 + px,
      y + 2 * verticalGap,
      'button-referral',
      'button-referral-pressed',
      () => {
        this.openReferralPopup();
      },
      { sound: 'button-1', disabledImage: 'button-square-disabled' }
    );
    this.referralButton.setDisabledState(isSimulator);

    this.dailySpinButton = new Button(
      scene,
      buttonSize / 2 + px,
      y + 3 * verticalGap,
      'button-daily-spin',
      'button-daily-spin-pressed',
      () => {
        this.openDailySpinPopup();
      },
      { sound: 'button-1', disabledImage: 'button-daily-spin-disabled' }
    );
    this.dailySpinButton.setDisabledState(isSimulator || dailySpinDisabled);

    this.holdButton = new Button(
      scene,
      buttonSize / 2 + px,
      y + 4 * verticalGap,
      'button-hold',
      'button-hold-pressed',
      () => {
        this.openHoldPopup();
      },
      { sound: 'button-1', disabledImage: 'button-hold-disabled' }
    );
    this.holdButton.setDisabledState(isSimulator || holdingRewardDisabled);
    this.dailySpinBadge = scene.add
      .image(
        this.dailySpinButton.x + this.dailySpinButton.width / 2 - 10,
        this.dailySpinButton.y - this.dailySpinButton.height / 2 + 10,
        'badge'
      )
      .setOrigin(0.5, 0.5);

    this.dailySpinBadgeText = scene.add
      .text(this.dailySpinBadge.x, this.dailySpinBadge.y, '0', {
        fontFamily: fontFamilies.extraBold,
        fontSize: '46px',
        color: '#fff',
      })
      .setOrigin(0.5, 0.5);

    this.referralText = scene.add
      .text(this.referralButton.x + this.referralButton.width / 2 + 50, this.referralButton.y, 'Referrals', {
        fontSize: '46px',
        fontFamily: fontFamilies.extraBold,
        color: '#fff',
      })
      .setOrigin(0, 0.5);

    this.dailySpinText = scene.add
      .text(this.dailySpinButton.x + this.dailySpinButton.width / 2 + 50, this.dailySpinButton.y, 'Spin to Win', {
        fontSize: '46px',
        fontFamily: fontFamilies.extraBold,
        color: dailySpinDisabled ? '#aaa' : '#fff',
      })
      .setOrigin(0, 0.5);

    this.holdText = scene.add
      .text(this.holdButton.x + this.holdButton.width / 2 + 50, this.holdButton.y, 'Hold to Earn', {
        fontSize: '46px',
        fontFamily: fontFamilies.extraBold,
        color: holdingRewardDisabled ? '#aaa' : '#fff',
      })
      .setOrigin(0, 0.5);

    if (!noBackground) {
      this.background = scene.add.rectangle(0, 0, width, height, 0x260343, 0.8).setOrigin(0, 0).setVisible(false);
      this.background.setInteractive().on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
        this.hidePopupReward();
      });
      this.add(this.background);
    }

    this.hideBadge();
    this.hidePopupReward();

    this.add(this.rewardButton);
    this.add(this.badge);
    this.add(this.badgeText);
    this.add(this.arrow);
    this.add(this.referralButton);
    this.add(this.dailySpinButton);
    this.add(this.holdButton);
    this.add(this.dailySpinBadge);
    this.add(this.dailySpinBadgeText);
    this.add(this.referralText);
    this.add(this.dailySpinText);
    this.add(this.holdText);

    scene.game.events.on(events.updateBadgeNumber, ({ numberOfSpins }) => {
      this.numberOfSpins = numberOfSpins;

      if (!numberOfSpins) {
        this.hideBadge();
        return;
      }

      this.badgeText.text = `${numberOfSpins}`;
      this.dailySpinBadgeText.text = `${numberOfSpins}`;
      this.showBadge();
    });
    scene.game.events.emit(events.requestBadgeNumber);
  }

  hideBadge() {
    this.badge?.setVisible(false);
    this.badgeText?.setVisible(false);
    this.dailySpinBadge?.setVisible(false);
    this.dailySpinBadgeText?.setVisible(false);
  }

  showBadge() {
    this.badge?.setVisible(true);
    this.badgeText?.setVisible(true);

    if (this.dailySpinButton?.visible) {
      this.dailySpinBadge?.setVisible(true);
      this.dailySpinBadgeText?.setVisible(true);
    }
  }

  hidePopupReward() {
    this.referralButton?.setVisible(false);
    this.dailySpinButton?.setVisible(false);
    this.holdButton?.setVisible(false);
    this.referralText?.setVisible(false);
    this.dailySpinText?.setVisible(false);
    this.holdText?.setVisible(false);
    this.dailySpinBadge?.setVisible(false);
    this.dailySpinBadgeText?.setVisible(false);
    this.background && this.background?.setVisible(false);
    this.arrow?.setTexture('arrow-down-gold');
  }

  showPopupReward() {
    this.referralButton?.setVisible(true);
    this.dailySpinButton?.setVisible(true);
    this.holdButton?.setVisible(true);
    this.referralText?.setVisible(true);
    this.dailySpinText?.setVisible(true);
    this.holdText?.setVisible(true);
    if (this.numberOfSpins) {
      this.dailySpinBadge?.setVisible(true);
      this.dailySpinBadgeText?.setVisible(true);
    }
    this.background && this.background?.setVisible(true);
    this.arrow?.setTexture('arrow-up-gold');
  }

  togglePopupReward() {
    if (this.referralButton?.visible) {
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

  openHoldPopup() {
    this.hidePopupReward();
    this.scene.popupHold?.open();
  }
}

export default InfoButtons;
