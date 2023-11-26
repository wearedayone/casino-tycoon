import Phaser from 'phaser';

import ActiveClaimButton from './ActiveClaimButton';
import DisabledClaimButton from './DiabledClaimButton';
import InActiveClaimButton from './InActiveClaimButton';

class ClaimButton extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, 0, 0);

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
      console.log({ claimable, active });
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

    scene.game.events.emit('request-claimable-status');
  }
}

export default ClaimButton;
