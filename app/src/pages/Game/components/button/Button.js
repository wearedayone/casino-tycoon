import Phaser from 'phaser';

class Button extends Phaser.GameObjects.Container {
  x = 0;
  y = 0;
  disabled = false;

  constructor(scene, x, y, defaultImage, pressedImage, onClick, { sound, disabledImage } = {}) {
    super(scene, x, y);
    this.x = x;
    this.y = y;

    this.defaultImage = scene.add.image(0, 0, defaultImage);
    this.pressedImage = scene.add.image(0, 0, pressedImage);

    this.add(this.defaultImage);
    this.add(this.pressedImage);
    this.setSize(this.defaultImage.width, this.defaultImage.height);

    this.pressedImage.setVisible(false);

    if (disabledImage) {
      this.disabledImage = scene.add.image(0, 0, disabledImage);
      this.add(this.disabledImage);
      this.disabledImage.setVisible(false);
    }

    if (sound) {
      this.btnSound = scene.sound.add(sound, { loop: false });
    }

    this.setInteractive()
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
        if (this.disabled) return;

        this.defaultImage.setVisible(false);
        this.pressedImage.setVisible(true);
        if (this.btnSound) {
          this.btnSound.play();
        }
      })
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
        if (this.disabled) return;

        this.defaultImage.setVisible(true);
        this.pressedImage.setVisible(false);
        onClick?.();
      });
  }

  setDisabledState(state) {
    this.disabled = state;
    if (this.disabledImage) {
      this.defaultImage.setVisible(!state);
      this.disabledImage.setVisible(state);
    }

    if (this.text && state) {
      this.text.setStroke('#515372', 10);
    }
  }
}

export default Button;
