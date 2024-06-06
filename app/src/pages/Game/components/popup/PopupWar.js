import Phaser from 'phaser';

const verticalGap = 300;

class PopupWar extends Phaser.GameObjects.Container {
  historyDisabled = false;
  warDisabled = false;
  onClick = () => {};

  constructor(scene, x, y) {
    super(scene, 0, 0);

    this.popup = scene.add.image(x, y, 'popup-war').setOrigin(0, 0);
    this.historyBtn = scene.add.image(x + this.popup.width / 2, y + 200, 'icon-history').setOrigin(0.5, 0.5);
    this.warBtn = scene.add
      .image(x + this.popup.width / 2, this.historyBtn.y + verticalGap, 'icon-war')
      .setOrigin(0.5, 0.5);

    this.btnSound = scene.sound.add('open', { loop: false });

    this.historyBtn.setInteractive().on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
      if (this.historyDisabled) return;
      this.btnSound.play();
      scene.popupWarHistory.open();
      this.onClick?.();
    });
    this.warBtn.setInteractive().on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
      if (this.warDisabled) return;
      this.btnSound.play();
      scene.popupWarMachines.open();
      this.onClick?.();
    });

    this.add(this.popup);
    this.add(this.historyBtn);
    this.add(this.warBtn);
    this.setVisible(false);
  }

  updateDisabled({ historyDisabled, warDisabled }) {
    this.historyDisabled = historyDisabled;
    this.warDisabled = warDisabled;
  }

  updateCallback(callback) {
    this.onClick = callback;
  }
}

export default PopupWar;
