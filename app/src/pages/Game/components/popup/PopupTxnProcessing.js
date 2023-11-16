import Phaser from 'phaser';

import Popup from './Popup';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs.json';
import environments from '../../../../utils/environments';

const { width, height } = configs;
const { NETWORK_ID } = environments;

class PopupTxnProcessing extends Popup {
  constructor(scene, icon, title, description, txnHash) {
    super(scene, 'popup-small', { title: 'Processing', openOnCreate: true });

    const startingY = this.popup.y - this.popup.height / 2;
    const iconY = startingY + 300;
    const titleY = iconY + 180;
    const descriptionY = titleY + 260;
    const viewTxnHashY = descriptionY + 200;

    this.icon = scene.add.image(width / 2, iconY, icon);
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
    this.viewTxnHash = scene.add.image(width / 2, viewTxnHashY, 'view-transaction');
    console.log('this.viewTxnHash', this.viewTxnHash);

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
      { fontSize: '82px' }
    );
    this.add(buttonGreat);

    this.viewTxnHash
      .setInteractive()
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
        this.viewTxnHash.setAlpha(0.5);
      })
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
        this.viewTxnHash.setAlpha(1);
        window.open(`https://${BASESCAN_PREFIX[NETWORK_ID]}basescan.org/tx/${txnHash}`);
      });
  }
}

export const BASESCAN_PREFIX = {
  1: '',
  84531: 'goerli.',
};

export default PopupTxnProcessing;
