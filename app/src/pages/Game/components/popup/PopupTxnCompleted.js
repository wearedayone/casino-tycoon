import Phaser from 'phaser';

import Popup from './Popup';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import environments from '../../../../utils/environments';

const { width, height } = configs;
const { NETWORK_ID } = environments;

class PopupTxnCompleted extends Popup {
  onCompleted;
  constructor(scene, icon, title, description, txnHash, { onCompleted, hideTxnHash = false }) {
    super(scene, 'popup-small', { title: 'Completed', openOnCreate: true });

    this.onCompleted = onCompleted;
    const startingY = this.popup.y - this.popup.height / 2;
    const iconY = startingY + (title ? 300 : 400);
    const titleY = title ? iconY + 180 : iconY + 80;
    const descriptionY = titleY + 260;
    const viewTxnHashY = descriptionY + 200;

    this.icon = scene.add.sprite(width / 2, iconY, icon);
    this.title = scene.add
      .text(width / 2, titleY, title, {
        fontSize: '100px',
        color: '#29000b',
        fontFamily: 'WixMadeforDisplayExtraBold',
        align: 'center',
      })
      .setOrigin(0.5, 0);
    const descriptionContainer = scene.add.image(width / 2, descriptionY, 'text-container');
    this.description = scene.add
      .text(width / 2, descriptionY, description, {
        fontSize: '52px',
        color: '#7c2828',
        fontFamily: 'WixMadeforDisplayBold',
        align: 'center',
      })
      .setOrigin(0.5, 0.5);
    this.viewTxnHash = scene.add.image(width / 2, viewTxnHashY, 'view-transaction').setVisible(!hideTxnHash);

    this.add(this.icon);
    this.add(this.title);
    this.add(descriptionContainer);
    this.add(this.description);
    this.add(this.viewTxnHash);

    const buttonGreat = new TextButton(
      scene,
      width / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      this.close,
      'Great',
      { fontSize: '82px', sound: 'close' }
    );
    this.add(buttonGreat);

    this.viewTxnHash
      .setInteractive()
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
        this.viewTxnHash.setAlpha(0.5);
      })
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
        this.viewTxnHash.setAlpha(1);
        window.open(`https://${SCANNER_URL[NETWORK_ID]}/tx/${txnHash}`);
      });
  }

  cleanup() {
    this.onCompleted?.();
  }

  updateIcon(newIcon) {
    this.icon.setTexture(newIcon);
  }
}

export const SCANNER_URL = {
  8453: 'basescan.org',
  84531: 'goerli.basescan.org',
  84532: 'sepolia.basescan.org',
  81457: 'blastscan.io',
  168587773: 'testnet.blastscan.io',
};

export default PopupTxnCompleted;
