import Phaser from 'phaser';

import Popup from './Popup';
import TextButton from '../button/TextButton';
import Button from '../button/Button';
import configs from '../../configs/configs';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';

const { width, height } = configs;

class PopupDepositETH extends Popup {
  code = '-----';

  constructor(scene) {
    super(scene, 'popup-small', { title: 'Deposit ETH' });

    const leftMargin = this.popup.x - this.popup.width / 2;
    const startingY = this.popup.y - this.popup.height / 2;
    const instructionY = startingY + 400;
    const depositCodeY = instructionY + 340;

    const instruction = scene.add.image(width / 2, instructionY, 'deposit-instruction');
    const depositLink = scene.add.image(width / 2, instructionY, 'deposit-link');
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
      () => navigator.clipboard.writeText(this.code)
    );

    this.add(instruction);
    this.add(depositLink);
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

    depositLink
      .setInteractive()
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
        depositLink.setAlpha(0.5);
      })
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
        depositLink.setAlpha(1);
        window.open(`https://gangsterarena.com/deposit`);
      });

    scene.game.events.on('update-deposit-code', (code) => {
      this.code = code;
      depositCode.text = `${code[0]} ${code[1]} ${code[2]}  ${code[3]} ${code[4]} ${code[5]}`;
    });
  }

  onOpen() {
    this.scene.game.events.emit('request-deposit-code');
  }
}

export default PopupDepositETH;
