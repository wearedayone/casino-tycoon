import Button from '../button/Button';

const buttonSize = 186;

class RankButton extends Button {
  constructor(scene, x, y, defaultImage, pressedImage, onClick, { sound, isSimulator } = {}) {
    super(scene, x, y, defaultImage, pressedImage, onClick, { sound });

    const events = {
      updateRank: isSimulator ? 'simulator-update-rank' : 'update-rank',
      requestRank: isSimulator ? 'simulator-request-rank' : 'request-rank',
    };

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

    scene.game.events.on(events.updateRank, ({ rank }) => {
      if (rank) this.valueText.text = `#${rank}`;
    });

    scene.game.events.emit(events.requestRank);
  }
}

export default RankButton;
