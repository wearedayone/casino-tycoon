import Phaser from 'phaser';

import Button from '../button/Button';

const buttonWidth = 77;
const px = 15;
const py = 5;

class Balance extends Phaser.GameObjects.Container {
  constructor(scene, x, y, img, text) {
    super(scene, 0, 0);

    this.container = scene.add.image(x, y, img).setOrigin(0.5, 0.5);
    this.addButton = new Button(
      scene,
      x + this.container.width / 2 - buttonWidth / 2 - px,
      y - py,
      'button-add',
      'button-add-pressed',
      () => console.log('clicked')
    );
    this.text = scene.add
      .text(x + 10, y - 5, text, {
        // font: 'bold 60px Arial',
        fontSize: '60px',
        // fontWeight: 'bold',
        fontFamily: 'WixMadeforDisplayBold',
        color: '#7C2828',
      })
      .setOrigin(0.5, 0.5);

    this.add(this.container);
    this.add(this.addButton);
    this.add(this.text);
  }

  updateText(newText) {
    this.text.text = newText;
  }
}

export default Balance;
