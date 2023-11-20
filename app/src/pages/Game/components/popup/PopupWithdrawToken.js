import { isAddress } from '@ethersproject/address';

import Popup from './Popup';
import PopupTxnProcessing from './PopupTxnProcessing';
import Button from '../button/Button';
import TextInput from '../inputs/TextInput';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs.json';
import {
  addressCharacterRegex,
  addressInputRegex,
  integerCharacterRegex,
  integerInputRegex,
} from '../../../../utils/strings';

const { width, height } = configs;

class PopupWithdrawToken extends Popup {
  loading = false;
  balance = 0;

  constructor(scene, parentModal) {
    super(scene, 'popup-small', { title: 'Withdraw $FIAT' });

    const x = width * 0.08;
    const startingY = this.popup.y - this.popup.height / 2;
    const subtitleY = startingY + 170;
    const amountInputY = subtitleY + 300;
    const balanceY = amountInputY + 130;
    const addressInputY = balanceY + 240;

    const subtitle = scene.add.text(width / 2, subtitleY, 'Enter the amount of $FIAT \nto withdraw', {
      fontSize: '60px',
      color: '#29000b',
      fontFamily: 'WixMadeforDisplayBold',
      align: 'center',
    });
    subtitle.setOrigin(0.5, 0);
    this.add(subtitle);

    this.amountInput = new TextInput(scene, width / 2, amountInputY, {
      icon: 'icon-coin',
      placeholder: '0',
      valueRegex: integerInputRegex,
      characterRegex: integerCharacterRegex,
      maxDisplayedCharacters: 13,
    });
    const buttonMax = new Button(scene, width * 0.77, amountInputY, 'button-max', 'button-max-pressed', () => {
      this.amountInput.updateValue(Math.floor(this.balance));
    });
    this.add(this.amountInput);
    this.add(buttonMax);

    this.balanceText = scene.add.text(width / 2, balanceY, `Balance: 0 $FIAT`, {
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
      width * 0.77,
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

    const buttonBack = new TextButton(
      scene,
      width / 4 + x / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      () => {
        this.close();
        parentModal.open();
      },
      'Back',
      { fontSize: '82px' }
    );
    this.buttonConfirm = new Button(
      scene,
      width * 0.75 - x / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-confirm',
      'button-confirm-pressed',
      () => {
        console.log('confirm');
        if (this.loading) return;

        // TODO: show validation to user
        const isValid = this.validate();
        if (!isValid) return;

        this.setLoading(true);
        scene.game.events.emit('withdraw-token', {
          amount: Number(this.amountInput.value),
          address: this.addressInput.value,
        });
      },
      { disabledImage: 'button-confirm-disabled' }
    );
    this.add(buttonBack);
    this.add(this.buttonConfirm);

    scene.game.events.on('withdraw-token-completed', () => this.setLoading(false));
    scene.game.events.on('withdraw-token-started', ({ txnHash, amount }) => {
      this.popupTxnProcessing = new PopupTxnProcessing(
        scene,
        'icon-coin-done',
        `${amount.toLocaleString()} $FIAT`,
        'Withdrawal may take a few minutes.',
        txnHash
      );
      scene.add.existing(this.popupTxnProcessing);
      this.close();
    });
  }

  validate() {
    let isValid = true;
    const amount = Number(this.amountInput.value);
    const address = this.addressInput.value.trim();

    if (!amount || amount > this.balance) isValid = false;
    if (!address || !isAddress(address)) isValid = false;

    return isValid;
  }

  setLoading(state) {
    console.log('setLoading', state);
    this.loading = state;
    this.buttonConfirm.setDisabledState(state);
  }

  cleanup() {
    // reset form
    this.amountInput.updateValue('');
    this.addressInput.updateValue('');
  }

  updateBalance(balance) {
    this.balance = balance;
    this.balanceText.text = `Balance: ${balance.toLocaleString()} $FIAT`;
  }
}

export default PopupWithdrawToken;
