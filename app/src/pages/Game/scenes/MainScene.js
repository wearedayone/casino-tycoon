import Phaser from 'phaser';

import Background from '../components/common/Background';
import PopupWelcomeNoWar from '../components/popup/PopupWelcomeNoWar';
import Header from '../components/action-buttons/Header';
import InfoButtons from '../components/action-buttons/InfoButtons';
import GangsterHouse from '../components/common/GangsterHouse';
import Footer from '../components/action-buttons/Footer';
import PopupBuy from '../components/popup/PopupBuy';
import PopupWar from '../components/popup/PopupWar';
import PopupSettings from '../components/popup/PopupSettings';
import PopupDailyGangWar from '../components/popup/PopupDailyGangWar';

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

    const gangsterHouse = new GangsterHouse(this, 2200, 1, 200);
    this.add.existing(gangsterHouse);

    const popupBuy = new PopupBuy(this, 955, 1600);
    this.add.existing(popupBuy);

    const popupWar = new PopupWar(this, 30, 1850);
    this.add.existing(popupWar);

    const footer = new Footer(
      this,
      2600,
      () => popupWar.setVisible(!popupWar.visible),
      () => popupBuy.setVisible(!popupBuy.visible)
    );
    footer.setDepth(1);
    this.add.existing(footer);

    // test
    // const popup = new PopupWelcomeNoWar(this, 2500);
    // this.add.existing(popup);
    const popupSettings = new PopupSettings(this, 2500);
    this.add.existing(popupSettings);
    popupSettings.setVisible(false);

    this.popupDailyGangWar = new PopupDailyGangWar(this);
    this.add.existing(this.popupDailyGangWar);

    const infoButtons = new InfoButtons(this, 550, () => popupSettings.setVisible(!popupSettings.visible));
    this.add.existing(infoButtons);
  }

  update() {}
}

export default MainScene;
