import Popup from './Popup';
import PopupProcessing from './PopupProcessing';
import Button from '../button/Button';
import TextInput from '../inputs/TextInput';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { integerCharacterRegex, integerInputRegex } from '../../../../utils/strings';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';

const { width, height } = configs;
const subtitleStyle = {
  color: colors.brown,
  fontFamily: fontFamilies.bold,
  align: 'center',
};

class PopupDepositNFT extends Popup {
  loading = false;
  balance = 0;

  constructor(scene, parentModal) {
    super(scene, 'popup-small', { title: 'Stake NFT' });

    const startingY = this.popup.y - this.popup.height / 2;
    const subtitleY = startingY + 200;
    const amountInputY = subtitleY + 420;
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

    this.balanceText = scene.add
      .text(width / 2, balanceY, `- of - Gangsters unstaked`, { ...subtitleStyle, fontSize: '50px' })
      .setOrigin(0.5, 0);
    this.add(this.balanceText);

    const note = scene.add
      .text(width / 2, balanceY + 120, `Gangsters bought in-app are automatically \nstaked`, {
        ...subtitleStyle,
        fontSize: '42px',
      })
      .setOrigin(0.5, 0);
    this.add(note);

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
    this.buttonStake = new Button(
      scene,
      width / 2 + this.popup.width * 0.23,
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

    scene.game.events.on('update-wallet-nft-balance', (data) => this.updateBalance(data));
    scene.game.events.on('deposit-nft-started', () => {
      this.popupProcessing = new PopupProcessing(scene, {
        completedEvent: 'deposit-nft-completed',
        completedIcon: 'icon-nft-done',
        description: `Staking may take a few minutes.`,
      });
      scene.add.existing(this.popupProcessing);
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
  }

  onOpen() {
    this.scene.game.events.emit('request-wallet-nft-balance');
  }

  cleanup() {
    // reset form
    this.amountInput.updateValue('');
  }

  updateBalance({ balance, numberOfMachines }) {
    const total = balance + numberOfMachines;
    this.balance = balance;
    this.balanceText.text = `${balance.toLocaleString()} of ${total.toLocaleString()} Gangsters unstaked`;
  }
}

export default PopupDepositNFT;
