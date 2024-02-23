import Button from './Button';

class ImageButton extends Button {
  constructor(scene, x, y, defaultImage, pressedImage, onClick, img, sound) {
    super(scene, x, y, defaultImage, pressedImage, onClick, { sound });

    this.img = scene.add.image(0, 0, img).setOrigin(0.5, 0.5);

    this.add(this.img);
  }
}

export default ImageButton;
