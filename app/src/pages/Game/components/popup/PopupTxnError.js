import Phaser from 'phaser';

import Popup from './Popup';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import environments from '../../../../utils/environments';

const { width, height } = configs;
const { NETWORK_ID } = environments;

class PopupTxnError extends Popup {
  constructor({ scene, code, title, description, action, txnHash }) {
    super(scene, 'popup-small', { title: 'Unsuccessful', openOnCreate: true });
    console.log({ code, title, description, action, txnHash });
    const startingY = this.popup.y - this.popup.height / 2;
    const iconY = startingY + 200;
    const titleY = iconY + 180;
    const descriptionY = titleY + 60;
    const actionY = descriptionY + 260;
    const viewTxnHashY = actionY + 200;
    let icon = 'icon-error-unknown';

    let customDescription = 'Unknown Error';
    switch (code) {
      case 'UNPREDICTABLE_GAS_LIMIT':
      case '-32603':
        icon = 'icon-error-insufficient';
        customDescription = 'Insufficient ETH\nfor Gas';
        action = 'Deposit more ETH';
        break;

      case 'INSUFFICIENT_FUNDS':
        icon = 'icon-error-insufficient';
        customDescription = 'Insufficient ETH\nfor NFT';
        action = 'Deposit more ETH';
        break;

      case '4001':
        icon = 'icon-error-unknown';
        customDescription = 'The user rejected\nthe request';
        action = 'Retry again';
        break;

      case '12002':
        icon = 'icon-error-network';
        customDescription = 'Network Error';
        action = 'Check your network';
        break;
      default:
    }

    this.icon = scene.add.image(width / 2, iconY, icon);
    this.title = scene.add
      .text(width / 2, titleY, title, {
        fontSize: '100px',
        color: '#29000b',
        fontFamily: 'WixMadeforDisplayExtraBold',
        align: 'center',
      })
      .setOrigin(0.5, 0);

    this.description = scene.add
      .text(width / 2, descriptionY, customDescription, {
        fontSize: '100px',
        color: '#000000',
        fontFamily: 'WixMadeforDisplayBold',
        align: 'center',
      })
      .setOrigin(0.5, 0.5);
    this.add(this.description);

    this.viewTxnHash = scene.add.image(width / 2, viewTxnHashY, 'view-transaction');
    console.log('this.viewTxnHash', this.viewTxnHash);

    this.add(this.icon);
    this.add(this.title);

    const descriptionContainer = scene.add.image(width / 2, actionY, 'text-container');
    this.add(descriptionContainer);

    if (action !== 'Deposit more ETH') {
      this.action = scene.add
        .text(width / 2, actionY, action, {
          fontSize: '52px',
          color: '#7c2828',
          fontFamily: 'WixMadeforDisplayBold',
          align: 'center',
        })
        .setOrigin(0.5, 0.5);
      this.add(this.action);
    } else {
      this.action = scene.add.image(width / 2, actionY, 'deposit-more-eth');
      this.add(this.action);
      this.action
        .setInteractive()
        .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
          this.viewTxnHash.setAlpha(0.5);
        })
        .on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
          this.viewTxnHash.setAlpha(1);
          scene.popupDeposit.open();
          this.close();
        });
    }

    this.add(this.viewTxnHash);
    if (txnHash) {
      this.viewTxnHash.setVisible(true);
    } else {
      this.viewTxnHash.setVisible(false);
    }
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
  8453: '',
  84531: 'goerli.',
};

export default PopupTxnError;
