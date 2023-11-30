import Button from './Button';
import { formatter } from '../../../../utils/numbers';

class InActiveClaimButton extends Button {
  constructor(scene, x, y) {
    super(scene, x, y, 'button-blue', 'button-blue', () => {}, { sound: 'coin' });

    this.text = scene.add
      .text(-30, -40, 'Claim', {
        fontSize: '82px',
        color: '#5895fd',
        fontFamily: 'WixMadeforDisplayExtraBold',
      })
      .setOrigin(0.5, 0.5);
    this.text.setStroke('#0004A0', 3);

    this.rewardText = scene.add
      .text(0, 35, '', {
        fontSize: '60px',
        color: '#5895fd',
        fontFamily: 'WixMadeforDisplayExtraBold',
      })
      .setOrigin(0.5, 0.5);
    this.rewardText.setStroke('#0004A0', 3);

    this.coinImage = scene.add.image(0 + this.text.width / 2 + 20, -35, 'coin').setOrigin(0.5, 0.5);

    this.add(this.text);
    this.add(this.rewardText);
    this.add(this.coinImage);

    scene.game.events.on('claim-activated', () => {
      this.loading = false;
      this.coinImage?.setVisible(true);
      this.text.text = 'Claim';
      this.text.x = -30;
      scene.game.events.emit('update-claimable-status', { claimable: true, active: true });
    });

    scene.game.events.on('update-claimable-reward', ({ reward }) => {
      this.rewardText.text = formatter.format(reward);
    });
    scene.game.events.emit('request-claimable-reward');
  }
}

export default InActiveClaimButton;
