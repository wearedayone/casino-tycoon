import Phaser from 'phaser';

import Popup from './Popup';
import PopupWithdraw from './PopupWithdraw';
import PopupDeposit from './PopupDeposit';
import PopupDepositNFT from './PopupDepositNFT';
import Button from '../button/Button';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import PopupSwap from './PopupSwap';

const { width, height } = configs;

class PopupSettings extends Popup {
  address = '';

  constructor(scene) {
    super(scene, 'popup-large', { title: 'Settings' });

    const leftMargin = this.popup.x - this.popup.width / 2;
    const paddedX = leftMargin + this.popup.width * 0.1;
    const longBtnX = width / 2;
    const medBtnX = width / 2 - this.popup.width * 0.23;
    const secondMedBtnX = width / 2 + this.popup.width * 0.23;
    const avatarSize = this.popup.width * 0.08;
    const avatarPadding = this.popup.width * 0.02;
    const avatarX = paddedX + avatarPadding + avatarSize / 2;
    const startingY = this.popup.y - this.popup.height / 2;
    const usernameY = startingY + 150;
    const walletContainerY = usernameY + 210;
    const exportWalletBtnY = walletContainerY + 280;
    const withdrawBtnY = exportWalletBtnY + 280;
    const stakingBtnY = withdrawBtnY + 180;
    const swapBtnY = stakingBtnY + 180;
    const soundBtnY = swapBtnY + 280;
    const creditTextY = soundBtnY + 100;

    // child modals
    const popupWithdraw = new PopupWithdraw(scene, this);
    this.popupDeposit = new PopupDeposit(scene, this);
    const popupStaking = new PopupDepositNFT(scene, this);
    const popupSwap = new PopupSwap(scene, this);
    scene.add.existing(popupWithdraw);
    scene.add.existing(this.popupDeposit);
    scene.add.existing(popupStaking);
    scene.add.existing(popupSwap);

    // user details
    this.username = scene.add.text(paddedX, usernameY, 'username', {
      fontSize: '60px',
      color: '#29000b',
      fontFamily: 'WixMadeforDisplayExtraBold',
    });
    this.walletContainer = scene.add.image(width / 2, walletContainerY, 'settings-wallet-container');
    this.circle = scene.add.graphics().setPosition(avatarX, walletContainerY).fillCircle(0, 0, avatarSize);
    this.avatar = scene.add.image(avatarX, walletContainerY, 'avatar').setSize(avatarSize, avatarSize);

    this.iconSettings = scene.add.image(paddedX + this.popup.width * 0.12, walletContainerY + 90, 'icon-settings');
    this.myWallet = scene.add.text(paddedX + 300, walletContainerY - 80, 'My Wallet:', {
      fontSize: '60px',
      color: '#29000b',
      fontFamily: 'WixMadeforDisplayBold',
    });
    this.addressText = scene.add.text(paddedX + 300, walletContainerY, 'address', {
      fontSize: '60px',
      color: '#7d2e00',
      fontFamily: 'WixMadeforDisplayBold',
    });
    this.buttonCopy = new Button(
      scene,
      leftMargin + this.popup.width * 0.85,
      walletContainerY,
      'button-copy',
      'button-copy-pressed',
      () => navigator.clipboard.writeText(this.address),
      { sound: 'button-2' }
    );
    this.buttonExportWallet = new TextButton(
      scene,
      medBtnX,
      exportWalletBtnY,
      'button-blue-med',
      'button-blue-med-pressed',
      () => scene.game.events.emit('export-wallet'),
      'Export Wallet',
      { sound: 'open' }
    );
    this.buttonLogOut = new TextButton(
      scene,
      secondMedBtnX,
      exportWalletBtnY,
      'button-red-med',
      'button-red-med-pressed',
      () => scene.game.events.emit('log-out'),
      'Logout',
      { icon: 'icon-logout', sound: 'close' }
    );

    this.add(this.username);
    this.add(this.walletContainer);
    this.add(this.avatar);
    this.avatar.setMask(this.circle.createGeometryMask());
    this.add(this.iconSettings);
    this.add(this.myWallet);
    this.add(this.addressText);
    this.add(this.buttonCopy);
    this.add(this.buttonExportWallet);
    this.add(this.buttonLogOut);

    // balance btns
    this.balanceBtnsContainer = scene.add
      .rectangle(this.popup.x + 12, withdrawBtnY, this.popup.width - 56, this.popup.height * 0.34, 0xf9cb73, 0.2)
      .setOrigin(0.5, 0.21);
    // this.balanceBtnsContainer.setStroke('#d08563', 5);
    this.buttonWithdraw = new TextButton(
      scene,
      medBtnX,
      withdrawBtnY,
      'button-blue-med',
      'button-blue-med-pressed',
      () => {
        this.close();
        popupWithdraw.open();
      },
      'Withdraw',
      { sound: 'open' }
    );
    this.buttonDeposit = new TextButton(
      scene,
      secondMedBtnX,
      withdrawBtnY,
      'button-blue-med',
      'button-blue-med-pressed',
      () => {
        this.close();
        this.popupDeposit.open();
      },
      'Deposit',
      { sound: 'open' }
    );
    this.buttonStaking = new TextButton(
      scene,
      longBtnX,
      stakingBtnY,
      'button-blue-long',
      'button-blue-long-pressed',
      () => {
        this.close();
        popupStaking.open();
      },
      'Staking',
      { sound: 'open' }
    );
    this.buttonSwap = new TextButton(
      scene,
      longBtnX,
      swapBtnY,
      'button-blue-long',
      'button-blue-long-pressed',
      () => {
        this.close();
        popupSwap.open();
      },
      'Swap (coming soon)',
      { disabledImage: 'button-long-disabled', sound: 'open' }
    );
    this.buttonSwap.setDisabledState(true);
    this.add(this.balanceBtnsContainer);
    this.add(this.buttonWithdraw);
    this.add(this.buttonDeposit);
    this.add(this.buttonStaking);
    this.add(this.buttonSwap);

    // others
    this.buttonSound = new TextButton(
      scene,
      longBtnX,
      soundBtnY,
      'button-green-long',
      'button-green-long-pressed',
      () => scene.game.events.emit('toggle-game-sound'),
      this.scene.game.config.audio.mute ? 'Game Sound: Off' : 'Game Sound: On',
      {
        icon: this.scene.game.config.audio.mute ? 'icon-sound-off' : 'icon-sound-on',
        sound: this.scene.game.config.audio.mute ? 'toggle-1' : 'toggle-2',
      }
    );
    this.credit = scene.add.text(width / 2, creditTextY, 'v1.0.0. Gangster Arena. Copyright.', {
      fontSize: '36px',
      color: '#7c2828',
      fontFamily: 'WixMadeforDisplayBold',
    });
    this.credit.setOrigin(0.5, 0);
    this.add(this.buttonSound);
    this.add(this.credit);

    this.buttonBack = new TextButton(
      scene,
      width / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      () => this.close(),
      'Back',
      { fontSize: '82px', sound: 'close' }
    );
    this.add(this.buttonBack);

    scene.game.events.on('game-sound-changed', ({ sound }) => this.updateGameSoundBtn(sound === 'on'));
    scene.game.events.on('update-profile', (data) => this.updateValues(data));
    scene.game.events.on('update-app-version', (data) => this.updateAppVersion(data));
  }

  onOpen() {
    this.scene.game.events.emit('request-profile');
    this.scene.game.events.emit('request-app-version');
  }

  updateGameSoundBtn(isSoundOn) {
    const text = isSoundOn ? 'Game Sound: On' : 'Game Sound: Off';
    const icon = isSoundOn ? 'icon-sound-on' : 'icon-sound-off';
    this.buttonSound.text.text = text;
    this.buttonSound.icon.setTexture(icon);
    this.scene.game.events.emit(isSoundOn ? 'music-on' : 'music-off');
    this.scene.game.sound.setMute(!isSoundOn);
  }

  updateValues({ username, address, avatarURL }) {
    this.username.text = username;
    this.addressText.text = `${address.slice(0, 5)}...${address.slice(-7)}`;
    this.address = address;
    this.popupDeposit.updateAddress(address);

    // load avatar
    let loader = new Phaser.Loader.LoaderPlugin(this.scene);
    // ask the LoaderPlugin to load the texture
    loader.image('avatarURL', avatarURL);
    loader.once(Phaser.Loader.Events.COMPLETE, () => this.avatar.setTexture('avatarURL'));
    loader.start();
  }

  updateAppVersion(appVersion) {
    this.credit.text = `v${appVersion}. Gangster Arena. Copyright.`;
  }
}

export default PopupSettings;
