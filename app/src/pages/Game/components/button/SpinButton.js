import Button from './Button';
import { fontFamilies } from '../../../../utils/styles';

class SpinButton extends Button {
  constructor(scene, { x, y, onClick, value }) {
    super(scene, x, y, 'button-spin', 'button-spin-pressed', onClick, { sound: 'button-1' });

    this.spinText = scene.add
      .text(-130, 0, 'Spin', { fontSize: '82px', fontFamily: fontFamilies.extraBold, color: '#fff' })
      .setOrigin(0.5, 0.5);
    this.spinText.setStroke('#0004A0', 10);

    this.valueText = scene.add
      .text(150, 0, `x${value}`, { fontSize: '82px', fontFamily: fontFamilies.extraBold, color: '#fff' })
      .setOrigin(0.5, 0.5);
    this.valueText.setStroke('#0004A0', 10);

    this.add(this.spinText);
    this.add(this.valueText);
  }
}

export default SpinButton;
