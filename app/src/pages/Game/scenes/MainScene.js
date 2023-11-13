import Phaser from 'phaser';

import Background from '../components/Background';
import Popup from '../components/Popup';

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  preload() {}

  create() {
    this.background = new Background(this, 'bg');
    this.add.existing(this.background);
    const popup = new Popup(this);
    this.add.existing(popup);
  }

  update() {}
}

export default MainScene;
