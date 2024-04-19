import Phaser from 'phaser';

import Popup from './Popup';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';

const { width, height } = configs;
const largeBlackBold = {
  fontSize: fontSizes.large,
  color: colors.black,
  fontFamily: fontFamilies.bold,
};

class PopupConfirm extends Popup {
  error = false;
  gas = 0;

  constructor(scene, parentModal, { title, action = '', icon1, icon2, onConfirm, checkboxTitle }) {
    super(scene, checkboxTitle ? 'popup-mini' : 'popup-tiny', { title });

    const leftMargin = this.popup.x - this.popup.width / 2;
    const checkBoxX = leftMargin + this.popup.width * 0.15;
    const startingY = this.popup.y - this.popup.height / 2;
    const areYouSureY = startingY + 150;
    const mainTextY = areYouSureY + 230;
    const checkBoxY = mainTextY + 200;

    const areYouSure = scene.add
      .text(width / 2, areYouSureY, `Are you sure you want to ${action}:`, {
        ...largeBlackBold,
        align: 'center',
      })
      .setOrigin(0.5, 0);
    this.add(areYouSure);
    const bg = scene.add.image(width / 2, mainTextY, 'container-short');
    this.add(bg);

    const forText = scene.add.text(width / 2, mainTextY, `for`, largeBlackBold).setOrigin(0, 0.5);
    this.add(forText);
    this.textLeft = scene.add.text(width / 2 - 20, mainTextY, '', largeBlackBold).setOrigin(1, 0.5);
    this.add(this.textLeft);
    if (icon1) {
      this.iconLeft = scene.add.image(width / 2 - 240, mainTextY, icon1).setOrigin(0.5, 0.5);
      this.add(this.iconLeft);
    }
    this.textRight = scene.add
      .text(width / 2 + 100, mainTextY, '', { ...largeBlackBold, fontFamily: fontFamilies.extraBold })
      .setOrigin(0, 0.5);
    this.iconRight = scene.add.image(width / 2 + this.popup.width * 0.28, mainTextY, icon2).setOrigin(0.5, 0.5);
    this.add(this.textRight);
    this.add(this.iconRight);

    const buttonNo = new TextButton(
      scene,
      width / 2 - this.popup.width * 0.23,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      () => {
        this.close();
        parentModal.open();
      },
      'No',
      { fontSize: '82px', sound: 'close' }
    );
    this.buttonYes = new TextButton(
      scene,
      width / 2 + this.popup.width * 0.23,
      height / 2 + this.popup.height / 2 - 20,
      'button-green',
      'button-green-pressed',
      () => {
        onConfirm();
        this.close();
      },
      'Yes',
      { sound: 'button-1', fontSize: '82px', disabledImage: 'button-disabled' }
    );
    this.buttonYes.setDisabledState(!!checkboxTitle);
    this.add(buttonNo);
    this.add(this.buttonYes);

    if (checkboxTitle) {
      this.checkboxUnchecked = scene.add.image(checkBoxX, checkBoxY, 'icon-checkbox-false').setOrigin(0.5, 0);
      this.checkboxChecked = scene.add
        .image(checkBoxX, checkBoxY, 'icon-checkbox-true')
        .setOrigin(0.5, 0)
        .setVisible(false);
      this.add(this.checkboxUnchecked);
      this.add(this.checkboxChecked);

      this.checkboxUnchecked.setInteractive().on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
        const approvedState = !this.checkboxChecked.visible;
        this.checkboxChecked.setVisible(approvedState);
        this.buttonYes.setDisabledState(!approvedState);
      });

      this.checkboxText = scene.add.text(checkBoxX + 50, checkBoxY, checkboxTitle, {
        fontSize: fontSizes.medium,
        color: colors.brown,
        fontFamily: fontFamilies.bold,
      });
      this.add(this.checkboxText);
    }
  }

  cleanup() {
    if (this.checkboxChecked) {
      const approvedState = false;
      this.checkboxChecked.setVisible(approvedState);
      this.buttonYes.setDisabledState(!approvedState);
    }
  }

  updateTextLeft(text) {
    this.textLeft.text = text;
    if (this.iconLeft) {
      const rightMarginText = text.split(icon1Gap)[1] || '';
      const rightMargin = rightMarginText.length * 36 + 60;
      this.iconLeft.x = width / 2 - rightMargin;
    }
  }
  updateTextRight(text) {
    this.textRight.text = text;
    this.iconRight.x = this.textRight.x + this.textRight.width + 60;
  }
  updateIconLeft(texture) {
    this.iconLeft.setTexture(texture);
  }
  updateIconRight(texture) {
    this.iconRight.setTexture(texture);
  }
}

export const icon1Gap = '              ';

export default PopupConfirm;
