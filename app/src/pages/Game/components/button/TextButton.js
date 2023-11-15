import Button from './Button';

class TextButton extends Button {
  constructor(
    scene,
    x,
    y,
    defaultImage,
    pressedImage,
    onClick,
    text,
    { color = '#fff', fontSize = '60px', icon } = {}
  ) {
    super(scene, x, y, defaultImage, pressedImage, onClick);

    const textX = icon ? 80 : 0;
    this.text = scene.add
      .text(textX, 0, text, {
        fontSize,
        color,
        fontFamily: 'WixMadeforDisplayBold',
      })
      .setOrigin(0.5, 0.5);

    let textStrokeColor;
    switch (defaultImage) {
      case 'button-blue':
      case 'button-blue-med':
      case 'button-blue-long':
        textStrokeColor = '#0004a0';
        break;
    }
    if (textStrokeColor) this.text.setStroke(textStrokeColor, 10);

    this.add(this.text);

    if (icon) {
      this.icon = scene.add.image(-this.text.width / 2, 0, icon);
      this.add(this.icon);
    }
  }
}

export default TextButton;
