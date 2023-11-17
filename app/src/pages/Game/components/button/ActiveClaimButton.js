import Button from './Button';
import { formatter } from '../../../../utils/numbers';

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
        this.loading = true;
        this.coinImage?.setVisible(false);
        this.text.text = 'Claiming...';
        this.text.x = 0;
        scene.game.events.emit('claim');
      },
      'coin'
    );

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

    this.coinSound = scene.sound.add('coin', { loop: false });

    scene.game.events.on('claim-completed', () => {
      this.loading = false;
      this.coinImage?.setVisible(true);
      this.text.text = 'Claim';
      this.text.x = -30;
      scene.game.events.emit('update-claimable-status', { claimable: false });
    });

    scene.game.events.on('update-claimable-reward', ({ reward }) => {
      this.rewardText.text = formatter.format(reward);
      this.coinSound.play();
    });
    scene.game.events.emit('request-claimable-reward');
  }
}

export default ActiveClaimButton;
