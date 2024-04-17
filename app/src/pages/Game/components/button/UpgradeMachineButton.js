import Button from './Button';
import { fontFamilies } from '../../../../utils/styles';
import { formatter } from '../../../../utils/numbers';

class UpgradeMachineButton extends Button {
  constructor(scene, { x, y, onClick, value }) {
    super(scene, x, y, 'button-green-full-length', 'button-green-full-length-pressed', onClick, {
      sound: 'button-1',
    });

    this.levelUpText = scene.add
      .text(0, -45, 'LEVEL UP', { fontSize: '52px', fontFamily: fontFamilies.extraBold, color: '#fff' })
      .setOrigin(0.5, 0.5);
    this.levelUpText.setStroke('#0C661E', 10);

    this.valueText = scene.add
      .text(0, 25, `${formatter.format(value)}`, {
        fontSize: '52px',
        fontFamily: fontFamilies.extraBold,
        color: '#fff',
      })
      .setOrigin(0.5, 0.5);
    this.valueText.setStroke('#0C661E', 10);

    this.icon = scene.add.image(0, 25, 'icon-xgang-small').setOrigin(0.5, 0.5);

    this.valueText.x -= this.icon.width / 2 + 5;
    this.icon.x = this.valueText.x + this.valueText.width / 2 + this.icon.width / 2 + 10;

    this.add(this.levelUpText);
    this.add(this.valueText);
    this.add(this.icon);
  }

  updateValue(newValue) {
    this.valueText.text = `${formatter.format(newValue)}`;
    this.valueText.x = 0 - this.icon.width / 2 + 5;
    this.icon.x = this.valueText.x + this.valueText.width / 2 + this.icon.width / 2 + 10;
  }
}

export default UpgradeMachineButton;
