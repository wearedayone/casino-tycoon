import Phaser from 'phaser';

import Popup from './Popup';
import PopupWithdrawToken from './PopupWithdrawToken';
import PopupWithdrawETH from './PopupWithdrawETH';
import PopupWithdrawNFT from './PopupWithdrawNFT';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { formatter } from '../../../../utils/numbers';

const { width, height } = configs;

class PopupWithdraw extends Popup {
  constructor(scene, parentModal) {
    super(scene, 'popup-small', { title: 'Withdraw' });

    const leftMargin = this.popup.x - this.popup.width / 2;
    const imageX = leftMargin + this.popup.width * 0.17;
    const resourceNameX = imageX + this.popup.width * 0.09;
    const resourceValueX = leftMargin + this.popup.width * 0.78;
    const resourceArrowIconX = leftMargin + this.popup.width * 0.84;
    const startingY = this.popup.y - this.popup.height / 2;
    const subtitleY = startingY + 150;
    const tokenContainerY = subtitleY + 240;
    const ethContainerY = tokenContainerY + 240;
    const gangsterContainerY = ethContainerY + 240;
    const resourceNameStyle = {
      fontSize: '60px',
      color: '#29000b',
      fontFamily: 'WixMadeforDisplayBold',
    };
    const availableTextStyle = {
      color: '#7c2828',
      fontFamily: 'WixMadeforDisplayBold',
      fontSize: '48px',
    };

    // child modals
    this.popupWithdrawToken = new PopupWithdrawToken(scene, this);
    this.popupWithdrawETH = new PopupWithdrawETH(scene, this);
    this.popupWithdrawNFT = new PopupWithdrawNFT(scene, this);
    scene.add.existing(this.popupWithdrawToken);
    scene.add.existing(this.popupWithdrawETH);
    scene.add.existing(this.popupWithdrawNFT);

    // user details
    const subtitle = scene.add.text(width / 2, subtitleY, 'Select assets to withdraw', resourceNameStyle);
    subtitle.setOrigin(0.5, 0);

    this.tokenContainer = scene.add.image(width / 2, tokenContainerY, 'text-container');
    const tokenIcon = scene.add.image(imageX, tokenContainerY, 'icon-coin');
    const tokenName = scene.add.text(resourceNameX, tokenContainerY, '$FIAT', resourceNameStyle).setOrigin(0, 0.5);
    this.tokenAmount = scene.add
      .text(resourceValueX, tokenContainerY, '0', { ...resourceNameStyle, fontSize: '48px' })
      .setOrigin(1, 1);
    const tokenAvailable = scene.add
      .text(resourceValueX, tokenContainerY, 'Available', availableTextStyle)
      .setOrigin(1, 0);
    const tokenArrow = scene.add.image(resourceArrowIconX, tokenContainerY, 'icon-chevron-right');

    this.ethContainer = scene.add.image(width / 2, ethContainerY, 'text-container');
    const ethIcon = scene.add.image(imageX, ethContainerY, 'icon-eth');
    const ethName = scene.add.text(resourceNameX, ethContainerY, 'ETH', resourceNameStyle).setOrigin(0, 0.5);
    this.ethAmount = scene.add
      .text(resourceValueX, ethContainerY, '0', { ...resourceNameStyle, fontSize: '48px' })
      .setOrigin(1, 1);
    const ethAvailable = scene.add.text(resourceValueX, ethContainerY, 'Available', availableTextStyle).setOrigin(1, 0);
    const ethArrow = scene.add.image(resourceArrowIconX, ethContainerY, 'icon-chevron-right');

    this.gangsterContainer = scene.add.image(width / 2, gangsterContainerY, 'text-container');
    const gangsterIcon = scene.add.image(imageX, gangsterContainerY, 'icon-gangster');
    const gangsterName = scene.add
      .text(resourceNameX, gangsterContainerY, 'Gangster \nNFT', resourceNameStyle)
      .setOrigin(0, 0.5);
    this.gangsterAmount = scene.add
      .text(resourceValueX, gangsterContainerY, '0 Gangster', { ...resourceNameStyle, fontSize: '48px' })
      .setOrigin(1, 1);
    const gangsterAvailable = scene.add
      .text(resourceValueX, gangsterContainerY, 'Available', availableTextStyle)
      .setOrigin(1, 0);
    const gangsterArrow = scene.add.image(resourceArrowIconX, gangsterContainerY, 'icon-chevron-right');

    this.add(subtitle);
    this.add(this.tokenContainer);
    this.add(tokenIcon);
    this.add(tokenName);
    this.add(tokenArrow);
    this.add(this.tokenAmount);
    this.add(tokenAvailable);
    this.add(this.ethContainer);
    this.add(ethIcon);
    this.add(ethName);
    this.add(this.ethAmount);
    this.add(ethAvailable);
    this.add(ethArrow);
    this.add(this.gangsterContainer);
    this.add(gangsterIcon);
    this.add(gangsterName);
    this.add(this.gangsterAmount);
    this.add(gangsterAvailable);
    this.add(gangsterArrow);

    const buttonBack = new TextButton(
      scene,
      width / 2,
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
    this.add(buttonBack);

    this.tokenContainer.setInteractive().on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      this.close();
      this.popupWithdrawToken.open();
    });
    this.ethContainer.setInteractive().on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      this.close();
      this.popupWithdrawETH.open();
    });
    this.gangsterContainer.setInteractive().on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      this.close();
      this.popupWithdrawNFT.open();
    });

    scene.game.events.on('update-balances-for-withdraw', (data) => this.updateValues(data));
    scene.game.events.emit('request-balances-for-withdraw');
  }

  onOpen() {
    // this.scene.game.events.emit('request-balances-for-withdraw');
  }

  updateValues({ ETHBalance, tokenBalance, NFTBalance }) {
    this.tokenAmount.text = tokenBalance.toLocaleString();
    this.ethAmount.text = formatter.format(ETHBalance);
    this.gangsterAmount.text = `${NFTBalance} Gangster${NFTBalance > 1 ? 's' : ''}`;

    this.popupWithdrawToken.updateBalance(tokenBalance);
    this.popupWithdrawETH.updateBalance(ETHBalance);
    this.popupWithdrawNFT.updateBalance(NFTBalance);
  }
}

export default PopupWithdraw;
