import Phaser from 'phaser';

import Popup from './Popup';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs.json';
import environments from '../../../../utils/environments';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';
import { BASESCAN_PREFIX } from './PopupTxnProcessing';

const { width, height } = configs;
const { NETWORK_ID } = environments;

class PopupTxnProcessingSwap extends Popup {
  constructor(scene, txnHash) {
    super(scene, 'popup-small', { title: 'Swap ETH/Coins', openOnCreate: true });

    const startingY = this.popup.y - this.popup.height / 2;
    const iconY = startingY + 360;
    const titleY = iconY + 220;
    const viewTxnHashY = titleY + 300;

    this.icon = scene.add.image(width / 2, iconY, 'swap');
    this.title = scene.add
      .text(width / 2, titleY, 'Allow ETH to be used \nfor swapping', {
        fontSize: fontSizes.large,
        color: colors.black,
        fontFamily: fontFamilies.bold,
        align: 'center',
      })
      .setOrigin(0.5, 0);
    this.viewTxnHash = new TextButton(
      scene,
      width / 2,
      viewTxnHashY,
      'button-green-long',
      'button-green-long-pressed',
      () => window.open(`https://${BASESCAN_PREFIX[NETWORK_ID]}basescan.org/tx/${txnHash}`),
      'Proceed in your wallet',
      { icon: 'icon-open-link', iconPosition: 'end', sound: 'toggle-2' }
    );

    this.add(this.icon);
    this.add(this.title);
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
        window.open(`https://${BASESCAN_PREFIX[NETWORK_ID]}basescan.org/tx/${txnHash}`);
      });
  }
}

export default PopupTxnProcessingSwap;
