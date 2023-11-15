import Button from '../button/Button';

const buttonSize = 186;

class RankButton extends Button {
  constructor(scene, x, y, defaultImage, pressedImage, onClick) {
    super(scene, x, y, defaultImage, pressedImage, onClick);

    this.valueText = scene.add
      .text(0, buttonSize / 4 + 10, ``, {
        fontSize: '42px',
        fontFamily: 'WixMadeforDisplayExtraBold',
        color: '#7C2828',
      })
      .setOrigin(0.5, 0.5);

    this.valueText.align = 'center';
    // this.valueText.setStroke('#FCFC68', 10);

    this.add(this.valueText);

    scene.game.events.on('update-rank', ({ rank }) => {
      if (rank) this.valueText.text = `#${rank}`;
    });

    scene.game.events.emit('request-rank');
  }
}

export default RankButton;
