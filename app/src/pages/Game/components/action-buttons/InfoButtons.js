import Phaser from 'phaser';

import Button from '../button/Button';
import RankButton from './RankButton';
import configs from '../../configs/configs';

const { width } = configs;

const px = 40;
const buttonSize = 186;
const verticalGap = buttonSize + 50;

class InfoButtons extends Phaser.GameObjects.Container {
  constructor(scene, y, { isSimulator } = {}) {
    super(scene, 0, 0);

    this.settingButton = new Button(
      scene,
      buttonSize / 2 + px,
      y,
      'button-setting',
      'button-setting-pressed',
      () => {
        if (isSimulator) return;
        scene.popupSettings.open();
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
        scene.popupReferralProgram.open();
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
        scene.popupLeaderboard.open();
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
        scene.popupPortfolio.open();
      },
      { sound: 'button-1' }
    );

    this.add(this.settingButton);
    this.add(this.referralButton);
    this.add(this.rankButton);
    this.add(this.portfolioButton);
  }
}

export default InfoButtons;
