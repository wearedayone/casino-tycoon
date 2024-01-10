import Phaser from 'phaser';

class TutorialCharacter extends Phaser.GameObjects.Container {
  constructor(scene, x, y, img, onNext) {
    super(scene, 0, 0);
    this.setDepth(100);
    this.image = scene.add.image(x, y, img).setOrigin(0.5, 0.5);
    this.add(this.image);

    this.image.setInteractive().on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      onNext();
    });
  }
}

export default TutorialCharacter;
