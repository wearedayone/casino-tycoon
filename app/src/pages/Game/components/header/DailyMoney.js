import Phaser from 'phaser';

class DailyMoney extends Phaser.GameObjects.Container {
  constructor(scene, x, y, text) {
    super(scene, 0, 0);

    this.container = scene.add.image(x, y, 'daily-money').setOrigin(0.5, 0.5);
    this.text = scene.add
      .text(x + 20, y - 10, text, {
        // font: 'bold 60px Arial',
        fontSize: '60px',
        fontWeight: 'bold',
        fontFamily: "'WixMadeforDisplay', sans-serif",
        color: '#7C2828',
      })
      .setOrigin(0.5, 0.5);

    this.add(this.container);
    this.add(this.text);
  }

  updateText(newText) {
    this.text.text = newText;
  }
}

export default DailyMoney;
