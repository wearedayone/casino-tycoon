import Popup from './Popup';
import PopupTxnProcessingSwap from './PopupTxnProcessingSwap';
import Button from '../button/Button';
import TextInput from '../inputs/TextInput';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs.json';
import {
  integerCharacterRegex,
  integerInputRegex,
  numberCharacterRegex,
  numberInputRegex,
} from '../../../../utils/strings';
import { formatter } from '../../../../utils/numbers';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';

const { width, height } = configs;

class PopupSwap extends Popup {
  loading = false;
  balance = 0;

  constructor(scene, parentModal) {
    super(scene, 'popup-small', { title: 'Swap' });

    const x = width * 0.08;
    const textX = width * 0.12;
    const startingY = this.popup.y - this.popup.height / 2;
    const youPayY = startingY + 170;
    const ethAmountInputY = youPayY + 200;
    const youReceiveY = ethAmountInputY + 120;
    const tokenAmountInputY = youReceiveY + 200;
    const priceImpactY = tokenAmountInputY + 140;
    const maxSlippageY = priceImpactY + 90;

    const youPay = scene.add.text(textX, youPayY, 'You pay:', {
      fontSize: fontSizes.large,
      color: colors.black,
      fontFamily: fontFamilies.bold,
    });
    this.ethAmountInput = new TextInput(scene, width / 2, ethAmountInputY, {
      icon: 'icon-eth',
      placeholder: '0.00',
      valueRegex: numberInputRegex,
      characterRegex: numberCharacterRegex,
      maxDisplayedCharacters: 13,
    });
    this.balanceText = scene.add
      .text(width - textX, ethAmountInputY, '0.00', {
        fontSize: fontSizes.medium,
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(1, 1);
    const available = scene.add
      .text(width - textX, ethAmountInputY, 'Available', {
        fontSize: fontSizes.medium,
        color: colors.brown,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(1, 0);
    this.add(youPay);
    this.add(this.ethAmountInput);
    this.add(this.balanceText);
    this.add(available);

    const youReceive = scene.add.text(textX, youReceiveY, 'You receive:', {
      fontSize: fontSizes.large,
      color: colors.black,
      fontFamily: fontFamilies.bold,
    });
    this.tokenAmountInput = new TextInput(scene, width / 2, tokenAmountInputY, {
      icon: 'icon-coin',
      placeholder: '0',
      valueRegex: integerInputRegex,
      characterRegex: integerCharacterRegex,
      maxDisplayedCharacters: 18,
    });
    this.add(youReceive);
    this.add(this.tokenAmountInput);

    const priceImpact = scene.add.text(textX, priceImpactY, 'Price Impact:', {
      fontSize: fontSizes.medium,
      color: colors.brown,
      fontFamily: fontFamilies.bold,
    });
    this.priceImpact = scene.add
      .text(width - textX, priceImpactY, '0.312%', {
        fontSize: fontSizes.medium,
        color: colors.brown,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(1, 0);
    const maxSlippage = scene.add.text(textX, maxSlippageY, 'Max. Slippage:', {
      fontSize: fontSizes.medium,
      color: colors.brown,
      fontFamily: fontFamilies.bold,
    });
    this.maxSlippage = scene.add
      .text(width - textX, maxSlippageY, '(Auto) 0.5%', {
        fontSize: fontSizes.medium,
        color: colors.brown,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(1, 0);
    this.add(priceImpact);
    this.add(this.priceImpact);
    this.add(maxSlippage);
    this.add(this.maxSlippage);

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
      { fontSize: '82px', sound: 'close' }
    );
    this.buttonApprove = new Button(
      scene,
      width * 0.75 - x / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-approve',
      'button-approve-pressed',
      () => {
        console.log('approve');
        if (this.loading) return;

        // TODO: show validation to user
        const isValid = this.validate();
        if (!isValid) return;

        this.setLoading(true);
        const data = {};
        scene.game.events.emit('swap', data);
      },
      { disabledImage: 'button-approve-disabled' }
    );
    this.add(buttonBack);
    this.add(this.buttonApprove);

    scene.game.events.on('update-eth-balance', (balance) => this.updateBalance(balance));
    scene.game.events.on('swap-completed', () => this.setLoading(false));
    scene.game.events.on('swap-started', ({ txnHash }) => {
      this.setLoading(false);
      this.popupTxnProcessing = new PopupTxnProcessingSwap(scene, txnHash);
      scene.add.existing(this.popupTxnProcessing);
      this.close();
    });
  }

  onOpen() {
    this.scene.game.events.emit('request-eth-balance');
  }

  validate() {
    let isValid = true;
    const amount = Number(this.ethAmountInput.value);

    if (!amount || amount > this.balance) isValid = false;

    return isValid;
  }

  setLoading(state) {
    console.log('setLoading', state);
    this.loading = state;
    this.buttonApprove.setDisabledState(state);
  }

  cleanup() {
    // reset form
    this.ethAmountInput.updateValue('');
    this.tokenAmountInput.updateValue('');
  }

  updateBalance(balance) {
    this.balance = balance;
    this.balanceText.text = `${formatter.format(balance)}`;
  }
}

export default PopupSwap;
