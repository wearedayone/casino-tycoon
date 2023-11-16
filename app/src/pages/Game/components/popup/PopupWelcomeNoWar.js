import Popup from './Popup';
import Button from '../button/Button';
import configs from '../../configs/configs.json';
import { formatter } from '../../../../utils/numbers';

const { width, height } = configs;

class PopupWelcomeNoWar extends Popup {
  constructor(scene, value) {
    super(scene, 'popup-welcome-nowar', { openOnCreate: true, destroyWhenClosed: true, ribbon: 'ribbon-welcome' });

    this.buttonClaim = new Button(
      scene,
      width / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-claim',
      'button-claim-pressed',
      () => console.log('claim btn clicked'),
      'button-1'
    );
    this.add(this.buttonClaim);

    this.valueText = scene.add
      .text(width / 2, height / 2 + 150, `+${formatter.format(value)}`, {
        fontSize: '128px',
        color: '#fff',
        fontFamily: 'WixMadeforDisplayExtraBold',
      })
      .setOrigin(0.5, 0.5);
    this.valueText.setStroke('#7C2828', 20);
    this.add(this.valueText);
  }
}

export default PopupWelcomeNoWar;
