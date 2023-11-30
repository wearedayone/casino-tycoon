import Button from './Button';
import configs from '../../configs/configs';
import { formatter } from '../../../../utils/numbers';

const { width, height } = configs;
class ActiveClaimButton extends Button {
  constructor(scene, x, y) {
    super(
      scene,
      x,
      y,
      'button-blue',
      'button-blue-pressed',
      () => {
        if (this.loading) return;
        this.startCoinAnimation();
        this.loading = true;
        this.coinImage?.setVisible(false);
        this.text.text = 'Claiming...';
        this.text.x = 0;
        scene.game.events.emit('claim');
      },
      { sound: 'coin' }
    );

    this.coinIcon = scene.add.image(x, y, 'icon-coin-glowing');
    this.text = scene.add
      .text(-30, -40, 'Claim', {
        fontSize: '82px',
        color: '#fff',
        fontFamily: 'WixMadeforDisplayExtraBold',
      })
      .setOrigin(0.5, 0.5);
    this.text.setStroke('#0004A0', 3);

    this.rewardText = scene.add
      .text(0, 35, '', {
        fontSize: '60px',
        color: '#fff',
        fontFamily: 'WixMadeforDisplayExtraBold',
      })
      .setOrigin(0.5, 0.5);
    this.rewardText.setStroke('#0004A0', 3);

    this.coinImage = scene.add.image(0 + this.text.width / 2 + 20, -35, 'coin').setOrigin(0.5, 0.5);

    this.add(this.text);
    this.add(this.rewardText);
    this.add(this.coinImage);

    scene.game.events.on('claim-completed', () => {
      this.loading = false;
      this.coinImage?.setVisible(true);
      this.text.text = 'Claim';
      this.text.x = -30;
      scene.game.events.emit('update-claimable-status', { claimable: false });
    });

    scene.game.events.on('update-claimable-reward', ({ reward }) => {
      this.rewardText.text = formatter.format(reward);
    });
    scene.game.events.emit('request-claimable-reward');
  }

  startCoinAnimation() {
    this.scene.tweens.add({
      targets: this.coinIcon,
      x: [
        width / 2 + 80,
        width / 2 + 120,
        width / 2 + 120,
        width / 2 + 100,
        width / 2 + 50,
        width / 2,
        width / 2 - 140,
      ],
      y: [this.y, height * 0.7, height / 2, height * 0.35, height * 0.2, height * 0.15, 250],
      duration: 2400,
      ease: 'Cubic.out',
      interpolation: 'bezier', // turn the points into curve
      hideOnComplete: true,
    });
  }
}

export default ActiveClaimButton;
