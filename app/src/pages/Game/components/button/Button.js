import Phaser from 'phaser';

class Button extends Phaser.GameObjects.Container {
  constructor(scene, x, y, defaultImage, pressedImage, onClick, sound) {
    super(scene, x, y);

    this.defaultImage = scene.add.image(0, 0, defaultImage);
    this.pressedImage = scene.add.image(0, 0, pressedImage);

    this.add(this.defaultImage);
    this.add(this.pressedImage);
    this.setSize(this.defaultImage.width, this.defaultImage.height);

    this.pressedImage.setVisible(false);

    if (sound) {
      this.btnSound = scene.sound.add(sound, { loop: false });
    }

    this.setInteractive()
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
        this.defaultImage.setVisible(false);
        this.pressedImage.setVisible(true);
        if (this.btnSound) {
          this.btnSound.play();
        }
      })
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
        this.defaultImage.setVisible(true);
        this.pressedImage.setVisible(false);
        onClick?.();
      });
  }
}

export default Button;
