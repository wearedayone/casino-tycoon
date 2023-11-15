import Phaser from 'phaser';

import ActiveClaimButton from './ActiveClaimButton';
import DisabledClaimButton from './DiabledClaimButton';

class ClaimButton extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, 0, 0);

    this.activeClaimButton = new ActiveClaimButton(scene, x, y);
    this.disabledClaimButton = new DisabledClaimButton(scene, x, y);

    this.activeClaimButton.setVisible(false);
    this.disabledClaimButton.setVisible(false);

    this.add(this.activeClaimButton);
    this.add(this.disabledClaimButton);

    scene.game.events.on('update-claimable-status', ({ claimable }) => {
      if (claimable) {
        this.activeClaimButton.setVisible(true);
        this.disabledClaimButton.setVisible(false);
      } else {
        this.activeClaimButton.setVisible(false);
        this.disabledClaimButton.setVisible(true);
      }
    });

    scene.game.events.emit('request-claimable-status');
  }
}

export default ClaimButton;
