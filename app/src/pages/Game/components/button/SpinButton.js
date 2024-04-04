import Button from './Button';
import { fontFamilies } from '../../../../utils/styles';

class SpinButton extends Button {
  constructor(scene, { x, y, onClick, value }) {
    super(scene, x, y, 'button-spin', 'button-spin-pressed', onClick, {
      sound: 'button-1',
      disabledImage: 'button-spin-disabled',
    });

    this.text = scene.add
      .text(0, 0, `${value}`, { fontSize: '82px', fontFamily: fontFamilies.extraBold, color: '#fff' })
      .setOrigin(0.5, 0.5);
    this.text.setStroke('#0004A0', 10);

    this.icon = scene.add.image(0, 0, 'icon-coin').setOrigin(0.5, 0.5);

    this.text.x -= this.icon.width / 2 + 5;
    this.icon.x = this.text.x + this.text.width / 2 + this.icon.width / 2 + 10;

    this.add(this.text);
    this.add(this.icon);
  }
}

export default SpinButton;
