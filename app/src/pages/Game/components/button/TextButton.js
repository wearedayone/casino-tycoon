import Button from './Button';

class TextButton extends Button {
  constructor(scene, x, y, defaultImage, pressedImage, onClick, text, color = '#fff', fontSize = '82px') {
    super(scene, x, y, defaultImage, pressedImage, onClick);

    this.text = scene.add
      .text(0, 0, text, {
        fontSize,
        color,
        fontFamily: 'WixMadeforDisplayBold',
      })
      .setOrigin(0.5, 0.5);

    this.add(this.text);
  }
}

export default TextButton;
