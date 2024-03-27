import { isAddress } from '@ethersproject/address';

import Popup from './Popup';
import PopupProcessing from './PopupProcessing';
import Button from '../button/Button';
import TextInput from '../inputs/TextInput';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import {
  addressCharacterRegex,
  addressInputRegex,
  integerCharacterRegex,
  integerInputRegex,
} from '../../../../utils/strings';

const { width, height } = configs;

class PopupWithdrawNFT extends Popup {
  loading = false;
  balance = 0;

  constructor(scene, parentModal) {
    super(scene, 'popup-small', { title: 'Withdraw NFT' });

    const startingY = this.popup.y - this.popup.height / 2;
    const subtitleY = startingY + 170;
    const amountInputY = subtitleY + 300;
    const balanceY = amountInputY + 130;
    const addressInputY = balanceY + 240;

    const subtitle = scene.add.text(width / 2, subtitleY, 'Enter the amount of Gangsters \nto withdraw', {
      fontSize: '60px',
      color: '#29000b',
      fontFamily: 'WixMadeforDisplayBold',
      align: 'center',
    });
    subtitle.setOrigin(0.5, 0);
    this.add(subtitle);

    this.amountInput = new TextInput(scene, width / 2, amountInputY, {
      icon: 'icon-gangster',
      placeholder: '0',
      valueRegex: integerInputRegex,
      characterRegex: integerCharacterRegex,
      maxDisplayedCharacters: 13,
    });
    const buttonMax = new Button(
      scene,
      width / 2 + this.popup.width * 0.3,
      amountInputY,
      'button-max',
      'button-max-pressed',
      () => {
        this.amountInput.updateValue(Math.floor(this.balance));
      }
    );
    this.add(this.amountInput);
    this.add(buttonMax);

    this.balanceText = scene.add.text(width / 2, balanceY, `Available units: 0`, {
      fontSize: '50px',
      color: '#7c2828',
      fontFamily: 'WixMadeforDisplayBold',
      align: 'center',
    });
    this.balanceText.setOrigin(0.5, 0);
    this.add(this.balanceText);

    this.addressInput = new TextInput(scene, width / 2, addressInputY, {
      placeholder: 'Enter Base address',
      valueRegex: addressInputRegex,
      characterRegex: addressCharacterRegex,
      maxDisplayedCharacters: 18,
    });
    const buttonPaste = new Button(
      scene,
      width / 2 + this.popup.width * 0.3,
      addressInputY,
      'button-paste',
      'button-paste-pressed',
      async () => {
        const text = await navigator.clipboard.readText();
        this.addressInput.updateValue(text.trim());
      }
    );
    this.add(this.addressInput);
    this.add(buttonPaste);

    this.errMSG = scene.add.text(width / 2, balanceY + 350, ``, {
      fontSize: '50px',
      color: '#E93D45',
      fontFamily: 'WixMadeforDisplayBold',
      align: 'center',
    });
    this.errMSG.setOrigin(0.5, 0);
    this.errMSG.setVisible(false);
    this.add(this.errMSG);

    const buttonBack = new TextButton(
      scene,
      width / 2 - this.popup.width * 0.23,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      () => {
        this.close();
        parentModal.open();
      },
      'Back',
      { fontSize: '82px', sound: 'close' }
    );
    this.buttonConfirm = new TextButton(
      scene,
      width / 2 + this.popup.width * 0.23,
      height / 2 + this.popup.height / 2 - 20,
      'button-green',
      'button-green-pressed',
      () => {
        // TODO: show validation to user
        const isValid = this.validate();
        if (!isValid) {
          this.errMSG.setVisible(true);
          return;
        }

        scene.game.events.emit('withdraw-nft', {
          amount: Number(this.amountInput.value),
          address: this.addressInput.value,
        });
      },
      'Confirm',
      { sound: 'button-1', fontSize: '82px', disabledImage: 'button-disabled' }
    );
    this.add(buttonBack);
    this.add(this.buttonConfirm);
    this.popupProcessing = new PopupProcessing(scene, {
      completedEvent: 'withdraw-nft-completed',
      completedIcon: 'icon-nft-done',
      description: `Withdrawal may take a few minutes.`,
    });
    scene.add.existing(this.popupProcessing);

    scene.game.events.on('withdraw-nft-started', () => {
      this.popupProcessing.initLoading(`Withdrawal may take a few minutes.`);
      this.close();
    });
  }

  validate() {
    let isValid = true;
    const amount = Number(this.amountInput.value);
    const address = this.addressInput.value.trim();

    if (!amount || amount > this.balance) {
      this.errMSG.text = 'Insufficient NFT';
      isValid = false;
    }
    if (!address || !isAddress(address)) {
      this.errMSG.text = 'Invalid address';
      isValid = false;
    }

    return isValid;
  }

  onOpen() {
    this.errMSG.setVisible(false);
  }

  cleanup() {
    // reset form
    this.amountInput.updateValue('');
    this.addressInput.updateValue('');
  }

  updateBalance(balance) {
    this.balance = balance;
    this.balanceText.text = `Available units: ${balance.toLocaleString()}`;
  }
}

export default PopupWithdrawNFT;
