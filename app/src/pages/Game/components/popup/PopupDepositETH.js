import Phaser from 'phaser';

import Popup from './Popup';
import TextButton from '../button/TextButton';
import Button from '../button/Button';
import configs from '../../configs/configs';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';

const { width, height } = configs;

class PopupDepositETH extends Popup {
  code = '-----';

  constructor(scene, { isSimulator, onOpen, onClose, ...configs } = {}) {
    super(scene, 'popup-small', { title: 'Deposit ETH', ...configs });
    this.onOpenCallback = onOpen;
    this.cleanup = onClose;
    this.isSimulator = isSimulator;

    const depositUrl = `${window.location.host}/deposit`;

    this.events = {
      requestDepositCode: isSimulator ? 'simulator-request-deposit-code' : 'request-deposit-code',
      updateDepositCode: isSimulator ? 'simulator-update-deposit-code' : 'update-deposit-code',
    };

    const leftMargin = this.popup.x - this.popup.width / 2;
    const startingY = this.popup.y - this.popup.height / 2;
    const instructionY = startingY + 400;
    const depositCodeY = instructionY + 340;

    const instruction = scene.add
      .text(width / 2, instructionY, `Visit ${depositUrl}\nin your phone or computer's browser\nand use this code:`, {
        fontSize: fontSizes.medium,
        color: colors.black,
        fontFamily: fontFamilies.bold,
        align: 'center',
      })
      .setOrigin(0.5, 0.5);
    const hyperlink = scene.add
      .text(width / 2 + 59, instructionY - instruction.height / 2, depositUrl, {
        fontSize: fontSizes.medium,
        color: '#fbf3e6',
        fontFamily: fontFamilies.bold,
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setAlpha(0.1);
    const hyperlinkLine = scene.add
      .rectangle(hyperlink.x, hyperlink.y + hyperlink.height, hyperlink.width, 3, 0x29000b, 1)
      .setOrigin(0.5, 0);
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
    this.add(hyperlink);
    this.add(hyperlinkLine);
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
        scene.popupDeposit.open();
      },
      'Back',
      { fontSize: '82px', sound: 'close' }
    );
    this.add(buttonBack);

    hyperlink
      .setInteractive()
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
        hyperlink.setAlpha(0.5);
        hyperlinkLine.setAlpha(0.5);
      })
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
        hyperlink.setAlpha(0.1);
        hyperlinkLine.setAlpha(1);
      })
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
        hyperlink.setAlpha(0.1);
        hyperlinkLine.setAlpha(1);
        window.open(`${window.location.protocol}//${depositUrl}`);
      });

    scene.game.events.on(this.events.updateDepositCode, (code) => {
      if (!code || code.length < 6) return;
      this.code = code;
      depositCode.text = `${code[0]} ${code[1]} ${code[2]}  ${code[3]} ${code[4]} ${code[5]}`;
    });
  }

  onOpen() {
    this.scene.game.events.emit(this.events.requestDepositCode);
    this.onOpenCallback?.();
  }
}

export default PopupDepositETH;
