import Phaser from 'phaser';
import moment from 'moment';

import Popup from './Popup';
import PopupProcessing from './PopupProcessing';
import Button from '../button/Button';
import TextInput from '../inputs/TextInput';
import TextButton from '../button/TextButton';
import ImageButton from '../button/ImageButton';
import configs from '../../configs/configs';
import { numberCharacterRegex, numberInputRegex } from '../../../../utils/strings';
import { formatter } from '../../../../utils/numbers';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';
import { getTokenFromXToken } from '../../../../utils/formulas';

const { width, height } = configs;
const mediumBrownBold = {
  fontSize: '50px',
  color: colors.brown,
  fontFamily: fontFamilies.bold,
};

const largeBlackBold = { fontSize: fontSizes.large, color: colors.black, fontFamily: fontFamilies.bold };

class ModeSwitch extends Phaser.GameObjects.Container {
  mode = '';

  constructor(scene, x, y, { containerImg = 'tabs-container', modeOne, modeTwo } = {}) {
    super(scene, 0, 0);
    this.mode = modeOne.title;
    const textStyle = { fontSize: '56px', color: '#ffffff', fontFamily: fontFamilies.bold, align: 'center' };

    this.container = scene.add.image(x, y, containerImg).setOrigin(0.5, 0.5);
    this.add(this.container);

    const buttonOffset = this.container.width / 4;
    this.btnOneInactive = scene.add.image(x - buttonOffset, y, 'button-blue-med-outlined').setOrigin(0.5, 0.5);
    this.btnOne = scene.add.image(x - buttonOffset, y, 'button-blue-med').setOrigin(0.5, 0.5);
    this.btnTwoInactive = scene.add.image(x + buttonOffset, y, 'button-blue-med-outlined').setOrigin(0.5, 0.5);
    this.btnTwo = scene.add
      .image(x + buttonOffset, y, 'button-blue-med')
      .setOrigin(0.5, 0.5)
      .setAlpha(0);
    this.add(this.btnOneInactive);
    this.add(this.btnOne);
    this.add(this.btnTwoInactive);
    this.add(this.btnTwo);

    this.textOne = scene.add
      .text(x - buttonOffset, y, modeOne.title, textStyle)
      .setStroke('#0004a0', 10)
      .setOrigin(0.5, 0.5);

    this.textTwo = scene.add
      .text(x + buttonOffset, y, modeTwo.title, { ...textStyle, color: '#0004a0' })
      .setStroke('#0004a0', 0)
      .setOrigin(0.5, 0.5);

    this.add(this.textOne);
    this.add(this.textTwo);

    this.arrow1 = scene.add.sprite(this.textOne.x + 32, y, 'arrow-2-white').setOrigin(0.5, 0.5);
    this.arrow2 = scene.add.sprite(this.textTwo.x + 18, y, 'arrow-1-blue').setOrigin(0.5, 0.5);
    this.add(this.arrow1);
    this.add(this.arrow2);

    this.container
      .setInteractive()
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (pointer, localX, localY, event) => {
        const isModeOneClicked = localX <= this.container.width / 2;
        this.btnOne.setAlpha(Number(isModeOneClicked));
        this.btnTwo.setAlpha(Number(!isModeOneClicked));

        const newMode = isModeOneClicked ? modeOne : modeTwo;
        this.mode = newMode.title;
        newMode.onClick();
        if (newMode === modeOne) {
          this.textOne.setColor('#fff');
          this.textOne.setStroke('#0004a0', 10);
          this.textTwo.setStroke('#0004a0', 0);
          this.textTwo.setColor('#0004a0');
          this.arrow1.setTexture('arrow-2-white');
          this.arrow2.setTexture('arrow-1-blue');
        } else {
          this.textOne.setStroke('#0004a0', 0);
          this.textOne.setColor('#0004a0');
          this.textTwo.setColor('#fff');
          this.textTwo.setStroke('#0004a0', 10);
          this.arrow1.setTexture('arrow-2-blue');
          this.arrow2.setTexture('arrow-1-white');
        }
      });
  }
}

class PopupSwap extends Popup {
  loading = false;
  error = false;
  ethBalance = 0;
  tokenBalance = 0;
  xTokenBalance = 0;
  gas = 0;
  tokenSwap = 'eth';
  timeout = null;
  interval = null;
  loading = false;
  mode = 'web3';
  nextConversionTime = null;

  constructor(scene, parentModal) {
    super(scene, 'popup-swap', { title: 'Swap' });

    const leftMargin = this.popup.x - this.popup.width / 2;
    const textX = leftMargin + this.popup.width * 0.1;
    const startingY = this.popup.y - this.popup.height / 2;
    const switchY = startingY + 220;
    const youPayY = switchY + 120;
    const token1AmountInputY = youPayY + 200;
    const youReceiveY = token1AmountInputY + 170;
    const token2AmountInputY = youReceiveY + 170;
    const feeText1Y = token2AmountInputY + 150;
    const feeText2Y = feeText1Y + 70;

    this.popupProcessing = new PopupProcessing(scene, {
      completedEvent: 'swap-completed',
      completedIcon: 'swap-eth-token',
      description: `Swapping may take a few minutes.`,
    });
    scene.add.existing(this.popupProcessing);

    this.modeSwitch = new ModeSwitch(scene, width / 2, switchY, {
      containerImg: 'swap-switch-container',
      modeOne: {
        title: 'GANG        ETH',
        onClick: () => {
          this.mode = 'web3';
          scene.game.events.emit('request-balances');
          if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
          }

          this.switchBtn.setVisible(true);
          this.feeText1.setVisible(true);
          this.feeText2.setVisible(true);
          this.tradingFeeText1.setVisible(true);
          this.tradingFeeText2.setVisible(true);
          this.nextConversionText.setVisible(false);
          this.clockIcon.setVisible(false);
          this.gameEndText.setVisible(false);

          this.token2AmountInput.setDisabled(false);

          this.tokenSwap = 'token';
          this.switch();
        },
      },
      modeTwo: {
        title: 'xGANG     GANG',
        onClick: () => {
          this.mode = 'web2';
          this.buttonApprove.setDisabledState(true);
          scene.game.events.emit('request-xtoken-balance');
          scene.game.events.emit('request-last-swap-x-token');
          if (this.interval) {
            clearInterval(this.interval);
          }
          this.interval = setInterval(() => this.countdown(), 1000);

          this.token1AmountInput.updateValue('0.00', true, true);
          this.token2AmountInput.updateValue('0.00', true, true);
          this.token1AmountInput.changeIcon('icon-xgang');
          this.token2AmountInput.changeIcon('icon-coin');
          this.token2AmountInput.setDisabled(true);

          this.switchBtn.setVisible(false);
          this.feeText1.setVisible(false);
          this.feeText2.setVisible(false);
          this.tradingFeeText1.setVisible(false);
          this.tradingFeeText2.setVisible(false);
          this.nextConversionText.setVisible(true);
          this.clockIcon.setVisible(true);
          this.gameEndText.setVisible(true);
        },
      },
    });
    this.add(this.modeSwitch);

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

        if (this.mode === 'web3') {
          if (!value || !Number(value)) {
            scene.game.events.emit(
              this.tokenSwap === 'eth' ? 'convert-eth-input-to-token-result' : 'convert-token-input-to-eth-result',
              { amount: '0.00', fee: 0 }
            );
            this.tradingFeeText1.text = `0.00 $GANG`;
            this.tradingFeeText2.text = `(~$0.0000 USD)`;

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
        }

        if (this.mode === 'web2') {
          if (!value || !Number(value)) {
            this.token2AmountInput.updateValue('0.0', true, true);
          }

          const tokenFromXToken = getTokenFromXToken(Number(value));
          this.token2AmountInput.updateValue(tokenFromXToken.toString(), true, true);
        }
      },
    });

    this.balanceText = scene.add
      .text(width - textX, token1AmountInputY + 15, '0.00', {
        fontSize: fontSizes.medium,
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(1, 0);
    this.available = scene.add
      .text(width - textX - 200, token1AmountInputY + 15, 'Balance', mediumBrownBold)
      .setOrigin(1, 0);
    this.add(youPay);
    this.add(this.token1AmountInput);
    this.add(this.balanceText);
    this.add(this.available);

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
            { amount: '0.00', fee: 0 }
          );
          this.tradingFeeText1.text = `0.00 $GANG`;
          this.tradingFeeText2.text = `(~$0.0000 USD)`;

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

    // for web3
    this.feeText1 = scene.add.text(textX, feeText1Y, 'Trading Fees - 5%', mediumBrownBold);
    this.feeText2 = scene.add.text(textX, feeText2Y, '(Burn & fund treasury)', mediumBrownBold);
    this.tradingFeeText1 = scene.add.text(width - textX, feeText1Y, '0 $GANG', mediumBrownBold).setOrigin(1, 0);
    this.tradingFeeText2 = scene.add
      .text(width - textX, feeText2Y, '(~$0.0000 USD)', { ...mediumBrownBold, fontSize: '36px' })
      .setOrigin(1, 0);
    this.add(this.feeText1);
    this.add(this.feeText2);
    this.add(this.tradingFeeText1);
    this.add(this.tradingFeeText2);

    // for web2
    this.nextConversionText = scene.add
      .text(width / 2, feeText1Y, 'Next conversion available in:', mediumBrownBold)
      .setOrigin(0.5, 0)
      .setVisible(0);
    this.clockIcon = scene.add
      .image(width / 2, feeText2Y, 'icon-clock')
      .setOrigin(0.5, 0)
      .setVisible(0);
    this.gameEndText = scene.add
      .text(width / 2, feeText2Y, '--d --h --m --s', largeBlackBold)
      .setOrigin(0.5, 0)
      .setVisible(0);
    this.clockIcon.x -= this.gameEndText.width / 2 + 10;
    this.gameEndText.x = this.clockIcon.x + this.clockIcon.width / 2 + this.gameEndText.width / 2 + 20;
    this.add(this.nextConversionText);
    this.add(this.clockIcon);
    this.add(this.gameEndText);

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
    this.buttonApprove = new TextButton(
      scene,
      width / 2 + this.popup.width * 0.23,
      height / 2 + this.popup.height / 2 - 20,
      'button-green',
      'button-green-pressed',
      () => {
        if (this.loading) return;

        // TODO: show validation to user
        const isValid = this.validate();
        if (!isValid) return;

        this.setLoading(true);
        if (this.mode === 'web3') {
          const data = {
            tokenSwap: this.tokenSwap,
            amount: Number(this.token1AmountInput.value),
          };
          scene.game.events.emit('swap', data);
        }

        if (this.mode === 'web2') {
          scene.game.events.emit('swap-x-token', { amount: Number(this.token1AmountInput.value) });
        }
      },
      'Approve',
      { sound: 'button-1', fontSize: '82px', disabledImage: 'button-disabled' }
    );
    this.add(buttonBack);
    this.add(this.buttonApprove);

    this.maxBtn = new TextButton(
      scene,
      width - textX - 80,
      token1AmountInputY - 30,
      'button-blue-mini',
      'button-blue-mini-pressed',
      () => {
        if (this.mode === 'web3') {
          const fee = this.tokenSwap === 'eth' ? Math.min(this.ethBalance, this.gas) : Math.min(this.tokenBalance, 1);
          const balance = this.tokenSwap === 'eth' ? this.ethBalance : Math.floor(this.tokenBalance);
          this.token1AmountInput.updateValue((balance - fee).toString(), true, true);
          this.setLoading(true);
          this.timeout = setTimeout(
            () =>
              scene.game.events.emit(
                this.tokenSwap === 'eth' ? 'convert-eth-input-to-token' : 'convert-token-input-to-eth',
                { amount: balance }
              ),
            500
          );
        }

        if (this.mode === 'web2') {
          this.token1AmountInput.updateValue(this.xTokenBalance.toString(), true, false);
        }
      },
      'Max',
      { fontSize: '46px', sound: 'button-1' }
    );
    this.add(this.maxBtn);

    scene.game.events.on('update-last-swap-x-token', ({ lastTimeSwapXToken, swapXTokenGapInSeconds }) => {
      if ((lastTimeSwapXToken, swapXTokenGapInSeconds)) {
        const nextTimeUnix = lastTimeSwapXToken.toDate().getTime() + swapXTokenGapInSeconds * 1000;
        this.nextConversionTime = nextTimeUnix;
        if (this.mode === 'web2') {
          this.buttonApprove.setDisabledState(true);
        }
      }
    });

    scene.game.events.on('update-gas-swap-eth-fiat', ({ gas }) => {
      if (isNaN(gas)) return;
      this.gas = gas;
    });
    scene.game.events.on('update-balances', ({ ETHBalance, tokenBalance }) =>
      this.updateBalance({ ETHBalance, tokenBalance })
    );

    scene.game.events.on('update-xtoken-balance', ({ balance }) => {
      this.updateXTokenBalance({ balance });
    });

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
    scene.game.events.on('convert-eth-input-to-token-result', ({ amount, tradingFee, tradingFeeInUSD }) => {
      this.token2AmountInput.updateValue(`${amount}`, true, true);
      this.tradingFeeText1.text = `${tradingFee} $GANG`;
      this.tradingFeeText2.text = `(~$${tradingFeeInUSD} USD)`;
      this.setLoading(false);
      this.setError(false);
    });
    scene.game.events.on('convert-eth-output-to-token-result', ({ amount, tradingFee, tradingFeeInUSD }) => {
      this.token1AmountInput.updateValue(`${amount}`, true, true);
      this.tradingFeeText1.text = `${tradingFee} $GANG`;
      this.tradingFeeText2.text = `(~$${tradingFeeInUSD} USD)`;
      this.setLoading(false);
      this.setError(false);
    });
    scene.game.events.on('convert-token-input-to-eth-result', ({ amount, tradingFee, tradingFeeInUSD }) => {
      this.token2AmountInput.updateValue(`${amount}`, true, true);
      this.tradingFeeText1.text = `${tradingFee} $GANG`;
      this.tradingFeeText2.text = `(~$${tradingFeeInUSD} USD)`;
      this.setLoading(false);
      this.setError(false);
    });
    scene.game.events.on('convert-token-output-to-eth-result', ({ amount, tradingFee, tradingFeeInUSD }) => {
      this.token1AmountInput.updateValue(`${amount}`, true, true);
      this.tradingFeeText1.text = `${tradingFee} $GANG`;
      this.tradingFeeText2.text = `(~$${tradingFeeInUSD} USD)`;
      this.setLoading(false);
      this.setError(false);
    });

    scene.game.events.on('update-fee-percent', ({ feePercent }) => {
      this.feeText1.text = `Trading Fees -${feePercent}%`;
    });
    scene.game.events.emit('request-balances');
    scene.game.events.emit('request-fee-percent');
    scene.game.events.emit('request-gas-swap-eth-fiat');
    scene.game.events.emit('request-last-swap-x-token');
  }

  countdown() {
    if (this.mode === 'web3') {
      clearInterval(this.interval);
      this.interval = null;
      return;
    }

    if (!this.nextConversionTime) return;

    const now = Date.now();
    if (this.nextConversionTime <= now) {
      this.gameEndText.text = `00d 00h 00m 00s`;
      this.clockIcon.x = width / 2 - this.gameEndText.width / 2 + 10;
      this.gameEndText.x = this.clockIcon.x + this.clockIcon.width / 2 + this.gameEndText.width / 2 + 20;
      this.buttonApprove.setDisabledState(false);
      return;
    }

    const endTime = moment(new Date(this.nextConversionTime));
    const diff = moment.duration(endTime.diff(new Date(now)));

    const day = Math.floor(diff.asDays()) < 10 ? `0${Math.floor(diff.asDays())}` : `${Math.floor(diff.asDays())}`;
    const hour = diff.hours() < 10 ? `0${diff.hours()}` : `${diff.hours()}`;
    const minute = diff.minutes() < 10 ? `0${diff.minutes()}` : `${diff.minutes()}`;
    const second = diff.seconds() < 10 ? `0${diff.seconds()}` : `${diff.seconds()}`;

    this.gameEndText.text = `${day}d ${hour}h ${minute}m ${second}s`;
    this.clockIcon.x = width / 2 - this.gameEndText.width / 2 + 10;
    this.gameEndText.x = this.clockIcon.x + this.clockIcon.width / 2 + this.gameEndText.width / 2 + 20;
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
    this.available.x = this.balanceText.x - this.balanceText.width - 20;
  }

  onOpen() {
    // this.scene.game.events.emit('request-balances');
  }

  validate() {
    let isValid = true;
    if (this.mode === 'web3') {
      if (!this.token1AmountInput.value || !this.token2AmountInput.value) return false;

      const inputAmount = Number(this.token1AmountInput.value);
      const userAmount = this.tokenSwap === 'eth' ? this.ethBalance : this.tokenBalance;

      if (!inputAmount || inputAmount > userAmount) isValid = false;
    }

    if (this.mode === 'web2') {
      if (!this.token1AmountInput.value || !this.token2AmountInput.value) return false;
      const inputAmount = Number(this.token1AmountInput.value);
      if (!inputAmount || inputAmount > this.xTokenBalance) isValid = false;
    }

    return isValid;
  }

  setLoading(state) {
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
    if (this.mode !== 'web3') return;
    this.ethBalance = ETHBalance;
    this.tokenBalance = tokenBalance;
    this.balanceText.text = `${formatter.format(this.tokenSwap === 'eth' ? ETHBalance : tokenBalance)}`;
    this.available.x = this.balanceText.x - this.balanceText.width - 20;
  }

  updateXTokenBalance({ balance }) {
    if (this.mode !== 'web2') return;
    this.xTokenBalance = balance;
    this.balanceText.text = `${formatter.format(this.xTokenBalance)}`;
    this.available.x = this.balanceText.x - this.balanceText.width - 20;
  }
}

export default PopupSwap;
