import Phaser from 'phaser';

import Button from '../button/Button';
import configs from '../../configs/configs.json';

class Popup extends Phaser.GameObjects.Container {
  destroyWhenClosed = false;

  constructor(
    scene,
    img = 'popup',
    { ribbon, title, openOnCreate = false, destroyWhenClosed = false, noCloseBtn = false } = {}
  ) {
    super(scene, 0, 0);
    this.destroyWhenClosed = destroyWhenClosed;

    this.background = scene.add.rectangle(0, 0, configs.width, configs.height, 0x000000, 0.4).setOrigin(0, 0);
    this.popup = scene.add.image(configs.width / 2, configs.height / 2, img).setOrigin(0.5, 0.5);
    this.add(this.background);
    this.add(this.popup);
    this.setDepth(5);

    // close on backdrop click
    this.background
      .setInteractive()
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (pointer, localX, localY, event) => {
        // TODO: fix popup cannot be closed when click on backdrop over open button position
        // example: open settings popup -> click on backdrop where settings btn is
        this.close();
      });
    this.popup.setInteractive().on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, emptyListener);

    if (!noCloseBtn) {
      this.closeButton = new Button(
        scene,
        configs.width / 2 + this.popup.width / 2 - 50,
        configs.height / 2 - this.popup.height / 2 + 50,
        'button-close',
        'button-close-pressed',
        this.close,
        'close'
      );
      this.add(this.closeButton);
    }

    if (ribbon) {
      this.ribbon = scene.add
        .image(configs.width / 2, configs.height / 2 - this.popup.height / 2, ribbon)
        .setOrigin(0.5, 0.5);
      this.add(this.ribbon);
      this.ribbon.setInteractive().on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, emptyListener);
    }

    if (title) {
      this.ribbon = scene.add
        .image(configs.width / 2, configs.height / 2 - this.popup.height / 2, 'popup-title')
        .setOrigin(0.5, 0.5);
      this.add(this.ribbon);

      const fontSize = '84px',
        fontFamily = 'WixMadeforDisplayExtraBold';

      const titleY = this.ribbon.y - 18;
      this.title = scene.add
        .text(this.ribbon.x, titleY, title, { fontSize, color: '#fff', fontFamily })
        .setOrigin(0.5, 0.5)
        .setStroke('#9e0a2e', 12);
      this.titleShadow = scene.add
        .text(this.ribbon.x, titleY + 5, title, { fontSize, color: '#9e0a2e', fontFamily })
        .setOrigin(0.5, 0.5)
        .setStroke('#9e0a2e', 12);
      this.add(this.titleShadow);
      this.add(this.title);

      if (!openOnCreate) this.setVisible(false);
      this.ribbon.setInteractive().on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, emptyListener);
    }
  }

  /* effects */
  // override to run effects after opening popup
  onOpen() {}
  // override to run effects before closing popup
  cleanup() {}

  open() {
    this.setVisible(true);
    this.onOpen();
  }
  close = () => {
    this.cleanup();
    if (this.destroyWhenClosed) this.destroy(true);
    else this.setVisible(false);
  };
}

// setup a listener to prevent popup/ribbon closing when clicked
const emptyListener = () => {};

export default Popup;
