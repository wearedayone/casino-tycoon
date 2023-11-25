import { isAddress } from '@ethersproject/address';

import Popup from './Popup';
import PopupTxnProcessing from './PopupTxnProcessing';
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
      () => this.amountInput.updateValue(formatter.format(this.balance))
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
        this.addressInput.updateValue(text.trim());
      }
    );
    this.add(this.addressInput);
    this.add(buttonPaste);

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
      { fontSize: '82px' }
    );
    this.buttonConfirm = new Button(
      scene,
      width / 2 + this.popup.width * 0.23,
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
        scene.game.events.emit('withdraw-eth', {
          amount: Number(this.amountInput.value),
          address: this.addressInput.value,
        });
      },
      { disabledImage: 'button-confirm-disabled' }
    );
    this.add(buttonBack);
    this.add(this.buttonConfirm);

    scene.game.events.on('withdraw-eth-completed', () => this.setLoading(false));
    scene.game.events.on('withdraw-eth-started', ({ txnHash, amount }) => {
      this.popupTxnProcessing = new PopupTxnProcessing(
        scene,
        'icon-eth-done',
        `${formatter.format(amount)} ETH`,
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
    this.balanceText.text = `ETH Balance: ${formatter.format(balance)} ETH`;
  }
}

export default PopupWithdrawETH;
