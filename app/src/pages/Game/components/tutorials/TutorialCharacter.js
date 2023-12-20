import Phaser from 'phaser';

class TutorialCharacter extends Phaser.GameObjects.Container {
  constructor(scene, x, y, img, onNext) {
    super(scene, 0, 0);

    this.image = scene.add.image(x, y, img).setOrigin(0.5, 0.5);
    this.add(this.image);

    this.nextButton = scene.add
      .image(x + this.image.width / 2 - 100, y - this.image.height / 2 + 850, 'tutorial-next')
      .setOrigin(0.5, 0.5);
    this.add(this.nextButton);

    this.nextButton.setInteractive().on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      onNext();
    });
  }
}

export default TutorialCharacter;
