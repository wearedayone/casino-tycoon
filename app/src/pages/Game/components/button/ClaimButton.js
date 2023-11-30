import Phaser from 'phaser';

import ActiveClaimButton from './ActiveClaimButton';
import DisabledClaimButton from './DiabledClaimButton';
import InActiveClaimButton from './InActiveClaimButton';
import { fontFamilies, fontSizes } from '../../../../utils/styles';
import { formatter } from '../../../../utils/numbers';

class ClaimButton extends Phaser.GameObjects.Container {
  claimableAmount = 0;

  constructor(scene, x, y) {
    super(scene, 0, 0);

    this.coinbagDropoffSound = scene.sound.add('coinbag-dropoff', { loop: false });
    this.addedAmountContainer = scene.add.container(x + 400, 1900, '');
    this.addedAmount = scene.add
      .text(0, 0, '', {
        fontSize: fontSizes.large,
        color: '#fff',
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(0.5, 0.5);
    this.addedAmount.setStroke('#000', 10);
    this.glowingCoin = scene.add.image(0, 0, 'icon-coin-glowing').setVisible(false);
    this.addedAmountContainer.add(this.addedAmount);
    this.addedAmountContainer.add(this.glowingCoin);

    this.activeClaimButton = new ActiveClaimButton(scene, x, y);
    this.inactiveClaimButton = new InActiveClaimButton(scene, x, y);
    this.disabledClaimButton = new DisabledClaimButton(scene, x, y);

    this.activeClaimButton.setVisible(false);
    this.disabledClaimButton.setVisible(false);
    this.inactiveClaimButton.setVisible(false);

    this.add(this.activeClaimButton);
    this.add(this.disabledClaimButton);
    this.add(this.inactiveClaimButton);

    scene.game.events.on('update-claimable-status', ({ claimable, active }) => {
      if (!active) {
        this.inactiveClaimButton.setVisible(true);
      } else if (claimable) {
        this.activeClaimButton.setVisible(true);
        this.disabledClaimButton.setVisible(false);
        this.inactiveClaimButton.setVisible(false);
      } else {
        this.activeClaimButton.setVisible(false);
        this.disabledClaimButton.setVisible(true);
        this.inactiveClaimButton.setVisible(false);
      }
    });

    scene.game.events.on('claimable-reward-added', () => {
      this.coinbagDropoffSound.play();
      this.glowingCoin.x = this.addedAmount.width / 2 + 80;
      this.glowingCoin.setVisible(true);

      this.scene.tweens.add({
        targets: this.addedAmountContainer,
        scale: [1, 0.5, 0],
        duration: 1200,
        ease: 'Cubic.out',
        hideOnComplete: true,
      });
    });

    scene.game.events.on('update-claimable-reward', ({ reward }) => {
      const difference = this.claimableAmount ? reward - this.claimableAmount : 0;
      this.addedAmount.text = `+${formatter.format(difference)}`;
      this.claimableAmount = reward;
    });

    scene.game.events.emit('request-claimable-reward');
    scene.game.events.emit('request-claimable-status');
  }
}

export default ClaimButton;
