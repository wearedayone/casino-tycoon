import Popup from './Popup';
import TextButton from '../button/TextButton';
import Button from '../button/Button';
import configs from '../../configs/configs';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';

const { width, height } = configs;

class PopupDepositETH extends Popup {
  code = '-----';

  constructor(scene, { isSimulator, onClose } = {}) {
    super(scene, 'popup-small', { title: 'Deposit ETH' });
    this.onClose = onClose;
    this.isSimulator = isSimulator;

    this.events = {
      requestDepositCode: isSimulator ? 'simulator-request-deposit-code' : 'request-deposit-code',
      updateDepositCode: isSimulator ? 'simulator-update-deposit-code' : 'update-deposit-code',
    };

    const leftMargin = this.popup.x - this.popup.width / 2;
    const startingY = this.popup.y - this.popup.height / 2;
    const instructionY = startingY + 400;
    const depositCodeY = instructionY + 340;

    const instruction = scene.add
      .text(
        width / 2,
        instructionY,
        `Visit ${window.location.host}/deposit\nin your phone or computer's browser\nand use this code:`,
        {
          fontSize: fontSizes.medium,
          color: colors.black,
          fontFamily: fontFamilies.bold,
          align: 'center',
        }
      )
      .setOrigin(0.5, 0.5);
    const textContainer = scene.add.image(width / 2, depositCodeY, 'text-container');
    const depositCode = scene.add
      .text(width / 2, depositCodeY, '- - -  - - -', {
        fontSize: fontSizes.extraLarge,
        color: colors.black,
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(0.5, 0.5);
    const copyButton = new Button(
      scene,
      leftMargin + this.popup.width * 0.83,
      depositCodeY,
      'button-copy',
      'button-copy-pressed',
      () => navigator.clipboard.writeText(this.code),
      { sound: 'button-2' }
    );

    this.add(instruction);
    this.add(textContainer);
    this.add(depositCode);
    this.add(copyButton);

    const buttonBack = new TextButton(
      scene,
      width / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      () => {
        this.close();
        if (!isSimulator) scene.popupDeposit.open();
      },
      'Back',
      { fontSize: '82px', sound: 'close' }
    );
    this.add(buttonBack);

    scene.game.events.on(this.events.updateDepositCode, (code) => {
      if (!code || code.length < 6) return;
      this.code = code;
      depositCode.text = `${code[0]} ${code[1]} ${code[2]}  ${code[3]} ${code[4]} ${code[5]}`;
    });
  }

  onOpen() {
    this.scene.game.events.emit(this.events.requestDepositCode);
  }
}

export default PopupDepositETH;
