import Phaser from 'phaser';

import Button from '../button/Button';
import RankButton from './RankButton';
import configs from '../../configs/configs.json';

const { width } = configs;

const px = 40;
const buttonSize = 186;
const verticalGap = buttonSize + 50;

class InfoButtons extends Phaser.GameObjects.Container {
  constructor(scene, y) {
    super(scene, 0, 0);

    this.settingButton = new Button(
      scene,
      buttonSize / 2 + px,
      y,
      'button-setting',
      'button-setting-pressed',
      () => scene.popupSettings.open(),
      { sound: 'button-1' }
    );

    this.referralButton = new Button(
      scene,
      buttonSize / 2 + px,
      y + verticalGap,
      'button-referral',
      'button-referral-pressed',
      () => console.log('referral clicked'),
      { sound: 'button-1' }
    );
    this.rankButton = new RankButton(
      scene,
      width - px - buttonSize / 2,
      y,
      'button-rank',
      'button-rank-pressed',
      () => scene.popupLeaderboard.open(),
      { sound: 'button-1' }
    );
    this.portfolioButton = new Button(
      scene,
      width - px - buttonSize / 2,
      y + verticalGap,
      'button-portfolio',
      'button-portfolio-pressed',
      () => scene.popupPortfolio.open(),
      { sound: 'button-1' }
    );

    this.add(this.settingButton);
    this.add(this.referralButton);
    this.add(this.rankButton);
    this.add(this.portfolioButton);
  }
}

export default InfoButtons;
