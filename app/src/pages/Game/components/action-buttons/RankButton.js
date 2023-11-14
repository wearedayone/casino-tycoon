import Button from '../button/Button';

const buttonSize = 186;

class RankButton extends Button {
  constructor(scene, x, y, defaultImage, pressedImage, onClick, value) {
    super(scene, x, y, defaultImage, pressedImage, onClick);

    this.valueText = scene.add
      .text(0, buttonSize / 4 + 10, `#${value}`, {
        fontSize: '42px',
        fontFamily: 'WixMadeforDisplayBold',
        color: '#7C2828',
      })
      .setOrigin(0.5, 0.5);

    this.valueText.align = 'center';
    // this.valueText.setStroke('#FCFC68', 10);

    this.add(this.valueText);
  }
}

export default RankButton;
