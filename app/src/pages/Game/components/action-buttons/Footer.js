import Phaser from 'phaser';

import Button from '../button/Button';
import configs from '../../configs/configs';
import DisabledClaimButton from '../button/DiabledClaimButton';
import ActiveClaimButton from '../button/ActiveClaimButton';
import ClaimButton from '../button/ClaimButton';

const { width } = configs;

const px = 40;
const buttonWidth = 288;

class Footer extends Phaser.GameObjects.Container {
  interval;
  scene;

  constructor(scene, y, { isSimulator } = {}) {
    super(scene, 0, 0);

    this.scene = scene;
    const events = {
      requestNextWarTime: isSimulator ? 'simulator-request-next-war-time' : 'request-next-war-time',
      updateNextWarTime: isSimulator ? 'simulator-update-next-war-time' : 'update-next-war-time',
    };
    this.events = events;

    this.buttonWar = new Button(
      scene,
      buttonWidth / 2 + px,
      y,
      'button-war',
      'button-war-pressed',
      () => {
        if (isSimulator) return;
        scene.popupBuy?.setVisible(false);
        scene.popupWar?.setVisible(!scene.popupWar?.visible);
        this.tooltipNextWar.setVisible(!scene.popupWar.visible);
        this.timeText.setVisible(!scene.popupWar.visible);
      },
      { sound: 'button-1' }
    );

    this.deployNowBadge = scene.add
      .image(buttonWidth / 2 + px - 5, y + this.buttonWar.height / 2, 'deploy-now')
      .setOrigin(0.5, 1);

    this.tooltipNextWar = scene.add
      .image(buttonWidth / 2 + px + 40, y - this.buttonWar.height / 2 + 30, 'tooltip-next-war')
      .setOrigin(0.5, 1);

    this.timeText = scene.add
      .text(buttonWidth / 2 + px - 20, y - this.tooltipNextWar.height + 75, `00h00m`, {
        // font: 'bold 60px Arial',
        fontSize: '50px',
        fontFamily: 'WixMadeforDisplayExtraBold',
        color: '#29000B',
      })
      .setOrigin(0, 0.5);

    this.buttonBuy = new Button(
      scene,
      width - px - buttonWidth / 2,
      y,
      'button-buy',
      'button-buy-pressed',
      () => {
        if (isSimulator) return;
        scene.popupWar?.setVisible(false);
        scene.popupBuy?.setVisible(!scene.popupBuy?.visible);
      },
      { sound: 'button-1' }
    );

    this.buttonClaim = isSimulator
      ? new Button(scene, width / 2, y, 'tutorial-claim-inactive-btn', 'tutorial-claim-inactive-btn', () => {})
      : new ClaimButton(scene, width / 2, y);

    this.add(this.buttonWar);
    this.add(this.deployNowBadge);
    this.add(this.tooltipNextWar);
    this.add(this.timeText);
    this.add(this.buttonBuy);
    this.add(this.buttonClaim);

    scene.game.events.on(events.updateNextWarTime, ({ time }) => {
      const now = Date.now();
      const diffInMins = (time - now) / (60 * 1000);
      const hours = Math.floor(diffInMins / 60);
      const mins = Math.floor(diffInMins % 60);

      const timeText = `${hours}h ${mins.toString().padStart(2, '0')}m`;
      this.timeText.text = timeText;
      if (this.interval) {
        clearInterval(this.interval);
      }

      this.interval = setInterval(() => this.calculateNextWarTime({ time }), 60 * 1000);
    });

    scene.game.events.emit(events.requestNextWarTime);
  }

  calculateNextWarTime({ time }) {
    const now = Date.now();
    const diffInMins = (time - now) / (60 * 1000);

    if (diffInMins < 560) {
      this.scene?.game.events.emit(this.events.requestNextWarTime);
      return;
    }

    const hours = Math.floor(diffInMins / 60);
    const mins = Math.floor(diffInMins % 60);

    const timeText = `${hours}h ${mins.toString().padStart(2, '0')}m`;
    this.timeText.text = timeText;
  }
}

export default Footer;
