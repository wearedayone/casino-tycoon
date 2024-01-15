import Popup from './Popup';
import PopupTxnProcessingSwap from './PopupTxnProcessingSwap';
import PopupProcessing from './PopupProcessing';
import Button from '../button/Button';
import TextInput from '../inputs/TextInput';
import TextButton from '../button/TextButton';
import ImageButton from '../button/ImageButton';
import configs from '../../configs/configs';
import {
  integerCharacterRegex,
  integerInputRegex,
  numberCharacterRegex,
  numberInputRegex,
} from '../../../../utils/strings';
import { formatter } from '../../../../utils/numbers';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';

const { width, height } = configs;
const mediumBrownBold = {
  fontSize: fontSizes.medium,
  color: colors.brown,
  fontFamily: fontFamilies.bold,
};

class PopupSwap extends Popup {
  loading = false;
  error = false;
  ethBalance = 0;
  tokenBalance = 0;
  tokenSwap = 'eth';
  timeout = null;
  loading = false;

  constructor(scene, parentModal) {
    super(scene, 'popup-small', { title: 'Swap' });

    const leftMargin = this.popup.x - this.popup.width / 2;
    const textX = leftMargin + this.popup.width * 0.1;
    const startingY = this.popup.y - this.popup.height / 2;
    const youPayY = startingY + 170;
    const token1AmountInputY = youPayY + 200;
    const youReceiveY = token1AmountInputY + 170;
    const token2AmountInputY = youReceiveY + 170;
    const priceImpactY = token2AmountInputY + 140;
    const maxSlippageY = priceImpactY + 90;

    this.popupProcessing = new PopupProcessing(scene, {
      completedEvent: 'swap-completed',
      completedIcon: 'swap-eth-token',
      description: `Swapping may take a few minutes.`,
    });
    scene.add.existing(this.popupProcessing);

    const youPay = scene.add.text(textX, youPayY, 'You pay:', {
      fontSize: fontSizes.large,
      color: colors.black,
      fontFamily: fontFamilies.bold,
    });
    this.token1AmountInput = new TextInput(scene, width / 2, token1AmountInputY, {
      icon: 'icon-eth',
      placeholder: '0.00',
      valueRegex: numberInputRegex,
      characterRegex: numberCharacterRegex,
      maxDisplayedCharacters: 13,
      onChange: (value) => {
        if (this.timeout) {
          clearTimeout(this.timeout);
        }

        if (!value || !Number(value)) {
          scene.game.events.emit(
            this.tokenSwap === 'eth' ? 'convert-eth-input-to-token-result' : 'convert-token-input-to-eth-result',
            { amount: '0.00', priceImpact: 0 }
          );
          this.priceImpact.text = '0.0%';
          return;
        }

        this.setLoading(true);

        this.timeout = setTimeout(
          () =>
            scene.game.events.emit(
              this.tokenSwap === 'eth' ? 'convert-eth-input-to-token' : 'convert-token-input-to-eth',
              {
                amount: Number(value),
              }
            ),
          500
        );
      },
    });
    this.balanceText = scene.add
      .text(width - textX, token1AmountInputY, '0.00', {
        fontSize: fontSizes.medium,
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(1, 1);
    const available = scene.add.text(width - textX, token1AmountInputY, 'Available', mediumBrownBold).setOrigin(1, 0);
    this.add(youPay);
    this.add(this.token1AmountInput);
    this.add(this.balanceText);
    this.add(available);

    const youReceive = scene.add
      .text(textX, youReceiveY, 'You receive:', {
        fontSize: fontSizes.large,
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0, 0.5);
    this.token2AmountInput = new TextInput(scene, width / 2, token2AmountInputY, {
      icon: 'icon-coin',
      placeholder: '0.00',
      valueRegex: numberInputRegex,
      characterRegex: numberCharacterRegex,
      maxDisplayedCharacters: 18,
      onChange: (value) => {
        if (this.timeout) {
          clearTimeout(this.timeout);
        }

        if (!value || !Number(value)) {
          scene.game.events.emit(
            this.tokenSwap === 'eth' ? 'convert-token-output-to-eth-result' : 'convert-eth-output-to-token-result',
            { amount: '0.00', priceImpact: 0 }
          );
          this.priceImpact.text = '0.0%';
          return;
        }

        this.setLoading(true);

        this.timeout = setTimeout(
          () =>
            scene.game.events.emit(
              this.tokenSwap === 'eth' ? 'convert-token-output-to-eth' : 'convert-eth-output-to-token',
              { amount: Number(value || '0') }
            ),
          500
        );
      },
    });
    this.add(youReceive);
    this.add(this.token2AmountInput);

    this.switchBtn = new ImageButton(
      scene,
      this.popup.x + this.popup.width / 2 - 130,
      youReceiveY,
      'button-square-small',
      'button-square-small-pressed',
      () => this.switch(),
      'swap-arrow',
      'button-1'
    );
    this.add(this.switchBtn);

    const priceImpact = scene.add.text(textX, priceImpactY, 'Price Impact:', mediumBrownBold);
    this.priceImpact = scene.add.text(width - textX, priceImpactY, '0.0%', mediumBrownBold).setOrigin(1, 0);
    const maxSlippage = scene.add.text(textX, maxSlippageY, 'Max. Slippage:', mediumBrownBold);
    this.maxSlippage = scene.add.text(width - textX, maxSlippageY, '(Auto) 0.5%', mediumBrownBold).setOrigin(1, 0);
    this.add(priceImpact);
    this.add(this.priceImpact);
    this.add(maxSlippage);
    this.add(this.maxSlippage);

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
    this.buttonApprove = new Button(
      scene,
      width / 2 + this.popup.width * 0.23,
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
        const data = {
          tokenSwap: this.tokenSwap,
          amount: Number(this.token1AmountInput.value),
        };
        scene.game.events.emit('swap', data);
      },
      { disabledImage: 'button-approve-disabled' }
    );
    this.add(buttonBack);
    this.add(this.buttonApprove);

    scene.game.events.on('update-balances', ({ ETHBalance, tokenBalance }) =>
      this.updateBalance({ ETHBalance, tokenBalance })
    );
    scene.game.events.on('swap-completed', () => this.setLoading(false));
    scene.game.events.on('swap-started', ({ txnHash }) => {
      this.setLoading(false);
      this.popupProcessing.initLoading(`Swapping may take a few minutes.`);
      this.close();
    });
    scene.game.events.on('swap-error', () => {
      this.setLoading(false);
      this.setError(true);
    });
    scene.game.events.on('convert-eth-input-to-token-result', ({ amount, priceImpact }) => {
      // console.log('convert-eth-input-to-token-result', { amount, priceImpact });
      this.token2AmountInput.updateValue(`${amount}`, true, true);
      this.priceImpact.text = `~${(priceImpact * 100).toFixed(2)}%`;
      this.setLoading(false);
      this.setError(false);
    });
    scene.game.events.on('convert-eth-output-to-token-result', ({ amount, priceImpact }) => {
      // console.log('convert-eth-output-to-token-result', { amount, priceImpact });
      this.token1AmountInput.updateValue(`${amount}`, true, true);
      this.priceImpact.text = `~${(priceImpact * 100).toFixed(2)}%`;
      this.setLoading(false);
      this.setError(false);
    });
    scene.game.events.on('convert-token-input-to-eth-result', ({ amount, priceImpact }) => {
      // console.log('convert-token-input-to-eth-result', { amount, priceImpact });
      this.token2AmountInput.updateValue(`${amount}`, true, true);
      this.priceImpact.text = `~${(priceImpact * 100).toFixed(2)}%`;
      this.setLoading(false);
      this.setError(false);
    });
    scene.game.events.on('convert-token-output-to-eth-result', ({ amount, priceImpact }) => {
      // console.log('convert-token-output-to-eth-result', { amount, priceImpact });
      this.token1AmountInput.updateValue(`${amount}`, true, true);
      this.priceImpact.text = `~${(priceImpact * 100).toFixed(2)}%`;
      this.setLoading(false);
      this.setError(false);
    });
  }

  switch() {
    if (this.loading) return;

    this.token1AmountInput.updateValue('0.00', true, true);
    this.token2AmountInput.updateValue('0.00', true, true);

    if (this.tokenSwap === 'eth') {
      this.tokenSwap = 'token';
      this.token1AmountInput.changeIcon('icon-coin');
      this.token2AmountInput.changeIcon('icon-eth');
      this.balanceText.text = `${formatter.format(this.tokenBalance)}`;
      this.popupProcessing.updateCompletedIcon('swap-token-eth');
    } else {
      this.tokenSwap = 'eth';
      this.token1AmountInput.changeIcon('icon-eth');
      this.token2AmountInput.changeIcon('icon-coin');
      this.balanceText.text = `${formatter.format(this.ethBalance)}`;
      this.popupProcessing.updateCompletedIcon('swap-eth-token');
    }
  }

  onOpen() {
    this.scene.game.events.emit('request-balances');
  }

  validate() {
    let isValid = true;
    if (!this.token1AmountInput.value || !this.token2AmountInput.value) return false;

    const inputAmount = Number(this.token1AmountInput.value);
    const userAmount = this.tokenSwap === 'eth' ? this.ethBalance : this.tokenBalance;

    if (!inputAmount || inputAmount > userAmount) isValid = false;

    return isValid;
  }

  setLoading(state) {
    console.log('setLoading', state);
    this.loading = state;
    this.buttonApprove.setDisabledState(state);
  }

  setError(state) {
    this.error = state;
    this.buttonApprove.setDisabledState(state);
  }

  cleanup() {
    // reset form
    this.token1AmountInput.updateValue('');
    this.token2AmountInput.updateValue('');
  }

  updateBalance({ ETHBalance, tokenBalance }) {
    console.log({ ETHBalance, tokenBalance });
    this.ethBalance = ETHBalance;
    this.tokenBalance = tokenBalance;
    this.balanceText.text = `${formatter.format(this.tokenSwap === 'eth' ? ETHBalance : tokenBalance)}`;
  }
}

export default PopupSwap;
