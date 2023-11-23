import Popup from './Popup';
import PopupTxnProcessing from './PopupTxnProcessing';
import Button from '../button/Button';
import TextInput from '../inputs/TextInput';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { integerCharacterRegex, integerInputRegex } from '../../../../utils/strings';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';

const { width, height } = configs;

class PopupDepositNFT extends Popup {
  loading = false;
  balance = 0;

  constructor(scene, parentModal) {
    super(scene, 'popup-small', { title: 'Deposit NFT' });

    const x = width * 0.08;
    const startingY = this.popup.y - this.popup.height / 2;
    const subtitleY = startingY + 200;
    const amountInputY = subtitleY + 450;
    const balanceY = amountInputY + 130;

    const subtitle = scene.add.text(width / 2, subtitleY, 'Enter the number of NFTs\nthat you wish to stake', {
      fontSize: fontSizes.large,
      color: colors.black,
      fontFamily: fontFamilies.bold,
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
    const buttonMax = new Button(scene, width * 0.77, amountInputY, 'button-max', 'button-max-pressed', () => {
      this.amountInput.updateValue(Math.floor(this.balance));
    });
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
    this.buttonStake = new Button(
      scene,
      width * 0.75 - x / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-stake',
      'button-stake-pressed',
      () => {
        console.log('stake');
        if (this.loading) return;

        // TODO: show validation to user
        const isValid = this.validate();
        if (!isValid) return;

        this.setLoading(true);
        scene.game.events.emit('deposit-nft', { amount: Number(this.amountInput.value) });
      },
      { disabledImage: 'button-stake-disabled' }
    );
    this.add(buttonBack);
    this.add(this.buttonStake);

    scene.game.events.on('update-wallet-nft-balance', (balance) => this.updateBalance(balance));

    scene.game.events.on('deposit-nft-completed', () => this.setLoading(false));
    scene.game.events.on('deposit-nft-started', ({ txnHash, amount }) => {
      this.popupTxnProcessing = new PopupTxnProcessing(
        scene,
        'icon-nft-done',
        `${amount.toLocaleString()} NFT${amount > 1 ? 's' : ''}`,
        'Deposit may take a few minutes.',
        txnHash
      );
      scene.add.existing(this.popupTxnProcessing);
      this.close();
    });
  }

  validate() {
    let isValid = true;
    const amount = Number(this.amountInput.value);

    if (!amount || amount > this.balance) isValid = false;

    return isValid;
  }

  setLoading(state) {
    console.log('setLoading', state);
    this.loading = state;
    this.buttonStake.setDisabledState(state);
  }

  onOpen() {
    this.scene.game.events.emit('request-wallet-nft-balance');
  }

  cleanup() {
    // reset form
    this.amountInput.updateValue('');
  }

  updateBalance(balance) {
    this.balance = balance;
    this.balanceText.text = `Available units: ${balance.toLocaleString()}`;
  }
}

export default PopupDepositNFT;
