import Popup from './Popup';
import Button from '../button/Button';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { formatter } from '../../../../utils/numbers';

const { width, height } = configs;

class PopupWelcomeNoWar extends Popup {
  constructor(scene, value) {
    super(scene, 'popup-welcome-nowar', { openOnCreate: true, destroyWhenClosed: true, ribbon: 'ribbon-welcome' });

    this.valueText = scene.add
      .text(width / 2, height / 2 + 150, `+${formatter.format(value)}`, {
        fontSize: '128px',
        color: '#fff',
        fontFamily: 'WixMadeforDisplayExtraBold',
      })
      .setOrigin(0.5, 0.5);
    this.valueText.setStroke('#7C2828', 20);
    this.add(this.valueText);

    scene.game.events.on('update-claimable-status', ({ claimable, active }) => {
      if (this.buttonClaim) {
        this.remove(this.buttonClaim);
        this.buttonClaim.destroy(true);
      }
      if (claimable && active) {
        this.buttonClaim = new Button(
          scene,
          width / 2,
          height / 2 + this.popup.height / 2 - 20,
          'button-claim',
          'button-claim-pressed',
          () => {
            if (this.loading) return;
            scene.game.events.emit('claim');
            this.close();
          },
          { sound: 'button-1' }
        );
        this.add(this.buttonClaim);
      } else {
        this.buttonClaim = new TextButton(
          scene,
          width / 2,
          height / 2 + this.popup.height / 2 - 20,
          'button-blue',
          'button-blue-pressed',
          () => this.close(),
          'Back',
          { sound: 'close', fontSize: '82px' }
        );
        this.add(this.buttonClaim);
      }
    });

    scene.game.events.emit('request-claimable-status');
  }
}

export default PopupWelcomeNoWar;
