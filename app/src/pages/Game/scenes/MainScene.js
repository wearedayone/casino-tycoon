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
import PopupSafeHouseUpgrade from '../components/popup/PopupSafeHouseUpgrade';
import PopupBuyGoon from '../components/popup/PopupBuyGoon';
import PopupBuyGangster from '../components/popup/PopupBuyGangster';

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  preload() {
    this.load.scenePlugin({
      key: 'rexuiplugin',
      url: '/libs/rexui.min.js',
      sceneKey: 'rexUI',
    });
  }

  create() {
    this.background = new Background(this, 'bg');
    this.add.existing(this.background);

    const header = new Header(this, 250);
    this.add.existing(header);

    const gangsterHouse = new GangsterHouse(this, 2200, 1, 200);
    this.add.existing(gangsterHouse);

    this.popupBuy = new PopupBuy(this, 955, 1600);
    this.add.existing(this.popupBuy);

    this.popupWar = new PopupWar(this, 30, 1850);
    this.add.existing(this.popupWar);

    const footer = new Footer(this, 2600);
    footer.setDepth(1);
    this.add.existing(footer);

    const popupSettings = new PopupSettings(this);
    this.add.existing(popupSettings);

    this.popupDailyGangWar = new PopupDailyGangWar(this);
    this.add.existing(this.popupDailyGangWar);

    this.popupSafeHouseUpgrade = new PopupSafeHouseUpgrade(this);
    this.add.existing(this.popupSafeHouseUpgrade);

    this.popupBuyGoon = new PopupBuyGoon(this);
    this.add.existing(this.popupBuyGoon);

    this.popupBuyGangster = new PopupBuyGangster(this);
    this.add.existing(this.popupBuyGangster);

    const infoButtons = new InfoButtons(this, 550, () => popupSettings.open());
    this.add.existing(infoButtons);

    // test
    // const popup = new PopupWelcomeNoWar(this, 2500);
    // this.add.existing(popup);
  }

  update() {}
}

export default MainScene;
