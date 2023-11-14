import Phaser from 'phaser';

import Background from '../components/common/Background';
import PopupWelcomeNoWar from '../components/popup/PopupWelcomeNoWar';
import Header from '../components/action-buttons/Header';
import InfoButtons from '../components/action-buttons/InfoButtons';
import GangsterHouse from '../components/common/GangsterHouse';
import Footer from '../components/action-buttons/Footer';

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  preload() {}

  create() {
    this.background = new Background(this, 'bg');
    this.add.existing(this.background);

    const header = new Header(this, 250);
    this.add.existing(header);

    const infoButtons = new InfoButtons(this, 550);
    this.add.existing(infoButtons);

    const gangsterHouse = new GangsterHouse(this, 2200, 1, 200);
    this.add.existing(gangsterHouse);

    const footer = new Footer(this, 2650);
    this.add.existing(footer);

    // test
    const popup = new PopupWelcomeNoWar(this, 2500);
    this.add.existing(popup);
  }

  update() {}
}

export default MainScene;
