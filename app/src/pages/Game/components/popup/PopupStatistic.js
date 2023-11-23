import Popup from './Popup';
import Button from '../button/Button';
import configs from '../../configs/configs';
import { formatter } from '../../../../utils/numbers';

const { width, height } = configs;

const gap = 185;

class PopupStatistic extends Popup {
  constructor(scene) {
    super(scene, 'popup-statistic', { ribbon: 'ribbon-statistic' });

    this.setVisible(false);

    this.backBtn = new Button(
      scene,
      width / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-back-portfolio',
      'button-back-portfolio-pressed',
      () => {
        this.close();
        scene.popupPortfolio.open();
      },
      { sound: 'close' }
    );
    this.add(this.backBtn);

    this.rankText = scene.add
      .text(this.popup.x + 480, this.popup.y - 480, ``, {
        fontSize: '60px',
        color: '#30030B',
        fontFamily: 'WixMadeforDisplayExtraBold',
      })
      .setOrigin(1, 0.5);
    this.add(this.rankText);

    this.networthText = scene.add
      .text(this.rankText.x, this.rankText.y + gap, ``, {
        fontSize: '60px',
        color: '#30030B',
        fontFamily: 'WixMadeforDisplayExtraBold',
      })
      .setOrigin(1, 0.5);
    this.add(this.networthText);

    this.numberOfMachinesText = scene.add
      .text(this.rankText.x, this.popup.y + 75, ``, {
        fontSize: '60px',
        color: '#30030B',
        fontFamily: 'WixMadeforDisplayExtraBold',
      })
      .setOrigin(1, 0.5);
    this.add(this.numberOfMachinesText);

    this.numberOfBuildingsText = scene.add
      .text(this.rankText.x, this.numberOfMachinesText.y + gap, ``, {
        fontSize: '60px',
        color: '#30030B',
        fontFamily: 'WixMadeforDisplayExtraBold',
      })
      .setOrigin(1, 0.5);
    this.add(this.numberOfBuildingsText);

    this.numberOfWorkersText = scene.add
      .text(this.rankText.x, this.numberOfBuildingsText.y + gap, ``, {
        fontSize: '60px',
        color: '#30030B',
        fontFamily: 'WixMadeforDisplayExtraBold',
      })
      .setOrigin(1, 0.5);
    this.add(this.numberOfWorkersText);

    scene.game.events.on(
      'update-statistic',
      ({ rank, totalPlayers, networth, numberOfWorkers, numberOfMachines, numberOfBuildings }) => {
        this.rankText.text = `${rank}/${formatter.format(totalPlayers)}`;
        this.networthText.text = `${formatter.format(networth)}`;
        this.numberOfMachinesText.text = `${formatter.format(numberOfMachines)} units`;
        this.numberOfBuildingsText.text = `${formatter.format(numberOfBuildings)} upgrades`;
        this.numberOfWorkersText.text = `${formatter.format(numberOfWorkers)} units`;
      }
    );

    scene.game.events.emit('request-statistic');
  }
}

export default PopupStatistic;
