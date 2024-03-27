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
  numberCharacterRegex,
  numberInputRegex,
} from '../../../../utils/strings';
import { formatter } from '../../../../utils/numbers';

const { width, height } = configs;

class PopupWithdrawETH extends Popup {
  loading = false;
  balance = 0;

  constructor(scene, parentModal) {
    super(scene, 'popup-small', { title: 'Withdraw ETH' });

    const startingY = this.popup.y - this.popup.height / 2;
    const subtitleY = startingY + 170;
    const amountInputY = subtitleY + 300;
    const balanceY = amountInputY + 130;
    const addressInputY = balanceY + 240;
    this.isWithdrawMax = false;
    this.defaultFee = 0.00005;

    const subtitle = scene.add.text(width / 2, subtitleY, 'Enter the amount of ETH \nto withdraw', {
      fontSize: '60px',
      color: '#29000b',
      fontFamily: 'WixMadeforDisplayBold',
      align: 'center',
    });
    subtitle.setOrigin(0.5, 0);
    this.add(subtitle);

    this.amountInput = new TextInput(scene, width / 2, amountInputY, {
      icon: 'icon-eth',
      placeholder: '0.00',
      valueRegex: numberInputRegex,
      characterRegex: numberCharacterRegex,
      maxDisplayedCharacters: 13,
    });
    const buttonMax = new Button(
      scene,
      width / 2 + this.popup.width * 0.3,
      amountInputY,
      'button-max',
      'button-max-pressed',
      () => {
        if (this.balance > this.defaultFee) {
          this.amountInput.updateValue(formatter.format(this.balance - this.defaultFee));
          this.isWithdrawMax = true;
        } else {
          this.amountInput.updateValue(0);
        }
      }
    );
    this.add(this.amountInput);
    this.add(buttonMax);

    this.balanceText = scene.add.text(width / 2, balanceY, `ETH Balance: 0 ETH`, {
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
        if (text) {
          this.addressInput.updateValue(text.trim());
        } else {
          this.errMSG.text = 'Clipboard is empty';
          this.errMSG.setVisible(true);
        }
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
        if (Number(this.amountInput.value) !== Number(formatter.format(this.balance - this.defaultFee))) {
          console.log('changed', {
            balance: formatter.format(this.balance - this.defaultFee),
            input: this.amountInput.value,
          });
          this.isWithdrawMax = false;
        }
        const isValid = this.validate();
        if (!isValid) {
          this.errMSG.setVisible(true);
          return;
        }

        scene.game.events.emit('withdraw-eth', {
          amount: this.isWithdrawMax ? this.balance - this.defaultFee : Number(this.amountInput.value),
          address: this.addressInput.value,
        });
      },
      'Confirm',
      { sound: 'button-1', fontSize: '82px', disabledImage: 'button-disabled' }
    );
    this.add(buttonBack);
    this.add(this.buttonConfirm);
    this.popupProcessing = new PopupProcessing(scene, {
      completedEvent: 'withdraw-eth-completed',
      completedIcon: 'icon-eth-done',
      description: `Withdrawal may take a few minutes.`,
    });
    scene.add.existing(this.popupProcessing);

    scene.game.events.on('withdraw-eth-started', () => {
      this.popupProcessing.initLoading(`Withdrawal may take a few minutes.`);
      this.close();
    });
  }

  validate() {
    let isValid = true;
    const amount = Number(this.amountInput.value);
    const address = this.addressInput.value.trim();
    if (!this.isWithdrawMax && (!amount || amount > this.balance)) {
      this.errMSG.text = 'Insufficient ETH';
      isValid = false;
    }
    if (!address || !isAddress(address)) {
      this.errMSG.text = 'Invalid address';
      isValid = false;
    }

    return isValid;
  }

  /* effects */
  // override to run effects after opening popup
  onOpen() {
    this.errMSG.setVisible(false);
    this.isWithdrawMax = false;
  }
  // override to run effects before closing popup
  cleanup() {
    // reset form
    this.amountInput.updateValue('');
    this.addressInput.updateValue('');
  }

  updateBalance(balance) {
    this.balance = balance;
    this.balanceText.text = `ETH Balance: ${formatter.format(balance)} ETH`;
  }
}

export default PopupWithdrawETH;
