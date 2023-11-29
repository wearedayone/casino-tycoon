import Phaser from 'phaser';

import Popup from './Popup';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';
import { formatter } from '../../../../utils/numbers';

const { width, height } = configs;
const largeBlackExtraBold = { fontSize: fontSizes.large, color: colors.black, fontFamily: fontFamilies.extraBold };
const largeBlackBold = { fontSize: fontSizes.large, color: colors.black, fontFamily: fontFamilies.bold };

class PopupDailyGangWar extends Popup {
  constructor(scene) {
    super(scene, 'popup-daily-gang-war', { ribbon: 'ribbon-daily-gang-war' });

    this.backBtn = new TextButton(
      scene,
      width / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      () => this.setVisible(false),
      'Back',
      { sound: 'close' }
    );
    this.add(this.backBtn);

    this.peaceSound = scene.sound.add('toggle-1', { loop: false });
    this.warSound = scene.sound.add('toggle-2', { loop: false });

    this.warBonusX = this.popup.x + this.popup.width * 0.25;
    const warBonusY = this.popup.y - this.popup.height / 2 + this.popup.height * 0.455;

    this.warBonus = scene.add.text(this.warBonusX - 60, warBonusY, '0', largeBlackExtraBold).setOrigin(0.5, 0.5);
    this.warBonusCoin = scene.add.image(this.warBonusX + this.warBonus.width / 2, warBonusY, 'coin2');
    this.add(this.warBonus);
    this.add(this.warBonusCoin);

    const contentY = this.popup.y + 50;
    const peaceX = this.popup.x - 380;
    const warX = this.popup.x + 220;
    const changeWarStatus = (war) => {
      const sound = war ? this.warSound : this.peaceSound;
      scene.game.events.emit('change-war-status', { war });
      sound.play();
    };

    this.checkedIconPeace = scene.add.image(peaceX, contentY, 'icon-checked').setOrigin(0.5, 0.5);
    this.uncheckedIconPeace = scene.add.image(peaceX, contentY, 'icon-unchecked').setOrigin(0.5, 0.5);
    const peaceText = scene.add.text(peaceX + 50, contentY, 'Peace', largeBlackBold).setOrigin(0, 0.5);
    this.uncheckedIconPeace
      .setInteractive()
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => changeWarStatus(false));
    peaceText.setInteractive().on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => changeWarStatus(false));
    this.checkedIconWar = scene.add.image(warX, contentY, 'icon-checked').setOrigin(0.5, 0.5);
    this.uncheckedIconWar = scene.add.image(warX, contentY, 'icon-unchecked').setOrigin(0.5, 0.5);
    const warText = scene.add.text(warX + 50, contentY, 'War', largeBlackBold).setOrigin(0, 0.5);
    this.uncheckedIconWar.setInteractive().on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => changeWarStatus(true));
    warText.setInteractive().on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => changeWarStatus(true));
    this.add(this.checkedIconPeace);
    this.add(this.uncheckedIconPeace);
    this.add(this.checkedIconWar);
    this.add(this.uncheckedIconWar);
    this.add(peaceText);
    this.add(warText);

    this.timeText = scene.add.text(this.popup.x + 120, this.popup.y + 185, '0h 00m', {
      fontSize: '50px',
      color: colors.black,
      fontFamily: fontFamilies.extraBold,
    });
    this.add(this.timeText);

    scene.game.events.on('update-balances', (data) => this.updateBonusRate(data));
    scene.game.events.on('update-war-status', ({ war }) => {
      this.checkedIconPeace.setVisible(!war);
      this.uncheckedIconPeace.setVisible(war);
      this.checkedIconWar.setVisible(war);
      this.uncheckedIconWar.setVisible(!war);
    });
    scene.game.events.on('update-next-war-time', ({ time }) => {
      const now = Date.now();
      const diffInMins = (time - now) / (60 * 1000);
      const hours = Math.floor(diffInMins / 60);
      const mins = Math.floor(diffInMins % 60);

      const timeText = `${hours}h ${mins.toString().padStart(2, '0')}m`;
      this.timeText.text = timeText;
    });
    scene.game.events.emit('request-war-status');
    scene.game.events.emit('request-next-war-time');
  }

  onOpen() {
    this.scene.game.events.emit('request-balances');
    this.scene.game.events.emit('request-next-war-time');
  }

  updateBonusRate({ dailyMoney }) {
    this.warBonus.text = `~${formatter.format(dailyMoney)}`;
    this.warBonusCoin.setX(this.warBonusX + this.warBonus.width / 2);
  }
}

export default PopupDailyGangWar;
