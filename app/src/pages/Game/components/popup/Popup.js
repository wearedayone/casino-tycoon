import Phaser from 'phaser';

import Button from '../button/Button';
import configs from '../../configs/configs';

const LARGE_TITLE_LIMIT = 15;
class Popup extends Phaser.GameObjects.Container {
  destroyWhenClosed = false;

  constructor(
    scene,
    img = 'popup',
    { ribbon, title, titleIcon, openOnCreate = false, destroyWhenClosed = false, noCloseBtn = false } = {}
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
        { sound: 'close' }
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
      const isTitleTooLong = title.length > LARGE_TITLE_LIMIT;
      const titleRibbon = isTitleTooLong ? 'popup-title-large' : 'popup-title';
      this.ribbon = scene.add
        .image(configs.width / 2, configs.height / 2 - this.popup.height / 2, titleRibbon)
        .setOrigin(0.5, 0.5);
      this.add(this.ribbon);

      const fontSize = isTitleTooLong ? '76px' : '84px',
        fontFamily = 'WixMadeforDisplayExtraBold';

      const titleY = this.ribbon.y - 18;
      const titleX = titleIcon ? this.ribbon.x + 70 : this.ribbon.x;
      this.title = scene.add
        .text(titleX, titleY, title, { fontSize, color: '#fff', fontFamily })
        .setOrigin(0.5, 0.5)
        .setStroke('#9e0a2e', 12);
      this.titleShadow = scene.add
        .text(titleX, titleY + 5, title, { fontSize, color: '#9e0a2e', fontFamily })
        .setOrigin(0.5, 0.5)
        .setStroke('#9e0a2e', 12);
      this.add(this.titleShadow);
      this.add(this.title);

      if (titleIcon) {
        this.titleIcon = scene.add.image(this.ribbon.x - this.title.width / 2, titleY, titleIcon);
        this.add(this.titleIcon);
      }

      this.ribbon.setInteractive().on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, emptyListener);
    }

    if (!openOnCreate) this.setVisible(false);
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
    // cant close while loading
    if (this.loading) return;

    this.cleanup();
    if (this.destroyWhenClosed) this.destroy(true);
    else this.setVisible(false);
  };

  setTitle(string) {
    if (!this.title) return;
    this.title.text = string;
    this.titleShadow.text = string;
  }
}

// setup a listener to prevent popup/ribbon closing when clicked
const emptyListener = () => {};

export default Popup;
