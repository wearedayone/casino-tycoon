import Phaser from 'phaser';

import Popup from './Popup';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs.json';

const { width, height } = configs;

class PopupDailyGangWar extends Popup {
  constructor(scene) {
    super(scene, 'popup-daily-gang-war', { ribbon: 'ribbon-daily-gang-war' });
    this.setVisible(false);

    this.backBtn = new TextButton(
      scene,
      width / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      () => this.setVisible(false),
      'Back'
    );
    this.add(this.backBtn);

    this.checkedIconPeace = scene.add.image(this.popup.x - 380, this.popup.y + 50, 'icon-checked').setOrigin(0.5, 0.5);
    this.uncheckedIconPeace = scene.add
      .image(this.popup.x - 380, this.popup.y + 50, 'icon-unchecked')
      .setOrigin(0.5, 0.5);
    this.uncheckedIconPeace.setInteractive().on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      scene.game.events.emit('change-war-status', { war: false });
    });

    this.checkedIconWar = scene.add.image(this.popup.x + 220, this.popup.y + 50, 'icon-checked').setOrigin(0.5, 0.5);
    this.uncheckedIconWar = scene.add
      .image(this.popup.x + 220, this.popup.y + 50, 'icon-unchecked')
      .setOrigin(0.5, 0.5);
    this.uncheckedIconWar.setInteractive().on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      scene.game.events.emit('change-war-status', { war: true });
    });

    this.checkedIconPeace.setVisible(false);
    this.uncheckedIconPeace.setVisible(false);
    this.checkedIconWar.setVisible(false);
    this.uncheckedIconWar.setVisible(false);

    this.add(this.checkedIconPeace);
    this.add(this.uncheckedIconPeace);
    this.add(this.checkedIconWar);
    this.add(this.uncheckedIconWar);

    this.timeText = scene.add.text(this.popup.x + 120, this.popup.y + 185, '0h0m', {
      fontSize: '50px',
      color: '#29000B',
      fontFamily: 'WixMadeforDisplayExtraBold',
    });
    this.add(this.timeText);

    scene.game.events.on('update-war-status', ({ war }) => {
      if (war) {
        this.checkedIconPeace.setVisible(false);
        this.uncheckedIconPeace.setVisible(true);
        this.checkedIconWar.setVisible(true);
        this.uncheckedIconWar.setVisible(false);
      } else {
        this.checkedIconPeace.setVisible(true);
        this.uncheckedIconPeace.setVisible(false);
        this.checkedIconWar.setVisible(false);
        this.uncheckedIconWar.setVisible(true);
      }
    });

    scene.game.events.on('update-next-war-time', ({ time }) => {
      const now = Date.now();
      const diffInMins = (time - now) / (60 * 1000);
      const hours = Math.floor(diffInMins / 60);
      const mins = Math.floor(diffInMins % 60);

      const timeText = `${hours}h${mins}m`;
      this.timeText.text = timeText;
    });

    scene.game.events.emit('request-war-status');
    scene.game.events.emit('request-next-war-time');
  }

  open() {
    this.setVisible(true);
    this.scene.game.events.emit('request-next-war-time');
  }
}

export default PopupDailyGangWar;
