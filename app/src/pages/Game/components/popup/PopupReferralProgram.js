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

class PopupReferralProgram extends Popup {
  loading = false;
  balance = 0;

  constructor(scene, data) {
    super(scene, 'popup_referral', { title: 'Referral Program' });
    const leftMargin = this.popup.x - this.popup.width / 2;
    const paddedX = leftMargin + this.popup.width * 0.1;
    const startingY = this.popup.y - this.popup.height / 2;
    const walletContainerY = startingY + 650;
    const earnedTextY = walletContainerY + 130;
    const inviteCodeY = startingY + 1600;

    this.walletContainer = scene.add.image(width / 2, walletContainerY, 'text-container-large');
    this.add(this.walletContainer);

    this.referralText = scene.add.text(paddedX + 200, walletContainerY - 20, '', {
      fontSize: '60px',
      color: '#7d2e00',
      fontFamily: 'WixMadeforDisplayBold',
    });
    this.add(this.referralText);
    this.buttonCopy = new Button(
      scene,
      leftMargin + this.popup.width * 0.85,
      walletContainerY,
      'button-copy',
      'button-copy-pressed',
      () => navigator.clipboard.writeText(this.referralCode),
      { sound: 'button-2' }
    );
    this.add(this.buttonCopy);
    this.earnedText = scene.add.text(width / 2, earnedTextY, `ETH earned: 0 ETH`, {
      fontSize: '48px',
      color: '#30030B',
      fontFamily: 'WixMadeforDisplayBold',
      align: 'center',
    });
    this.earnedText.setOrigin(0.5, 0);
    this.add(this.earnedText);

    this.savedText = scene.add.text(width / 2, earnedTextY + 100, `ETH saved: 0 ETH`, {
      fontSize: '48px',
      color: '#30030B',
      fontFamily: 'WixMadeforDisplayBold',
      align: 'center',
    });
    this.savedText.setOrigin(0.5, 0);
    this.add(this.savedText);

    this.inviteCode = new TextInput(scene, width / 2, inviteCodeY, {
      placeholder: 'Enter referral code',
      valueRegex: addressInputRegex,
      characterRegex: addressCharacterRegex,
      maxDisplayedCharacters: 18,
    });
    const buttonPaste = new Button(
      scene,
      width / 2 + this.popup.width * 0.3,
      inviteCodeY,
      'button-paste',
      'button-paste-pressed',
      async () => {
        const text = await navigator.clipboard.readText();
        this.inviteCode.updateValue(text.trim());
      },
      { disabledImage: 'button-apply-disabled' }
    );
    buttonPaste.setDisabledState(true);
    this.add(this.inviteCode);
    this.add(buttonPaste);

    const buttonBack = new TextButton(
      scene,
      width / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue-long',
      'button-blue-long-pressed',
      () => {
        this.close();
      },
      'Continue game',
      { fontSize: '82px' }
    );

    this.add(buttonBack);

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

    scene.game.events.on('update-referral-code', (referralCode) => {
      this.referralCode = referralCode;
      this.referralText.text = referralCode?.toUpperCase();
    });
  }

  onOpen() {
    this.scene.game.events.emit('request-referral-code');
  }

  setLoading(state) {
    console.log('setLoading', state);
    this.loading = state;
    this.buttonConfirm.setDisabledState(state);
  }

  cleanup() {
    // reset form
    // this.amountInput.updateValue('');
    this.inviteCode.updateValue('');
  }
}

export default PopupReferralProgram;
