import Phaser from 'phaser';

import Background from '../components/common/Background';
import PopupWelcomeNoWar from '../components/popup/PopupWelcomeNoWar';
import Header from '../components/header/Header';

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  preload() {}

  create() {
    this.background = new Background(this, 'bg');
    this.add.existing(this.background);

    const header = new Header(this);
    this.add.existing(header);

    // test
    const popup = new PopupWelcomeNoWar(this, 2500);
    this.add.existing(popup);
  }

  update() {}
}

export default MainScene;
