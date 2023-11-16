import Phaser from 'phaser';

import Popup from './Popup';
import PopupWithdraw from './PopupWithdraw';
import Button from '../button/Button';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs.json';

const { width, height } = configs;

class PopupSettings extends Popup {
  address = '';

  constructor(scene) {
    super(scene, 'popup-large', { title: 'Settings' });

    const x = width * 0.08;
    const longBtnX = width / 2;
    const medBtnX = x + width * 0.21;
    const secondMedBtnX = width * 0.71;
    const avatarSize = width * 0.08;
    const avatarPadding = width * 0.07;
    const avatarX = x + avatarPadding + avatarSize / 2;
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
    scene.add.existing(popupWithdraw);

    // user details
    this.username = scene.add.text(x + 20, usernameY, 'username', {
      fontSize: '60px',
      color: '#29000b',
      fontFamily: 'WixMadeforDisplayExtraBold',
    });
    this.walletContainer = scene.add.image(width / 2, walletContainerY, 'settings-wallet-container');
    this.circle = scene.add.graphics().setPosition(avatarX, walletContainerY).fillCircle(0, 0, avatarSize);
    this.avatar = scene.add.image(avatarX, walletContainerY, 'avatar').setSize(avatarSize, avatarSize);

    this.iconSettings = scene.add.image(x + 200, walletContainerY + 90, 'icon-settings');
    this.myWallet = scene.add.text(x + 300, walletContainerY - 80, 'My Wallet:', {
      fontSize: '60px',
      color: '#29000b',
      fontFamily: 'WixMadeforDisplayBold',
    });
    this.addressText = scene.add.text(x + 300, walletContainerY, 'address', {
      fontSize: '60px',
      color: '#7d2e00',
      fontFamily: 'WixMadeforDisplayBold',
    });
    this.buttonCopy = new Button(
      scene,
      width * 0.82,
      walletContainerY,
      'button-copy',
      'button-copy-pressed',
      () => navigator.clipboard.writeText(this.address),
      'button-2'
    );
    this.buttonExportWallet = new TextButton(
      scene,
      medBtnX,
      exportWalletBtnY,
      'button-blue-med',
      'button-blue-med-pressed',
      () => console.log('export wallet'),
      'Export Wallet',
      { sound: 'open' }
    );
    this.buttonLogOut = new TextButton(
      scene,
      secondMedBtnX,
      exportWalletBtnY,
      'button-red-med',
      'button-red-med-pressed',
      () => console.log('logout'),
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
      () => console.log('deposit'),
      'Deposit',
      { sound: 'open' }
    );
    this.buttonStaking = new TextButton(
      scene,
      longBtnX,
      stakingBtnY,
      'button-blue-long',
      'button-blue-long-pressed',
      () => console.log('staking'),
      'Staking',
      { sound: 'open' }
    );
    this.buttonSwap = new TextButton(
      scene,
      longBtnX,
      swapBtnY,
      'button-blue-long',
      'button-blue-long-pressed',
      () => console.log('swap'),
      'Swap',
      { sound: 'open' }
    );
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
      'Game Sound: On',
      { icon: 'icon-sound-on', sound: 'toggle-2' }
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
  }

  onOpen() {
    this.scene.game.events.emit('request-profile');
  }

  updateGameSoundBtn(isSoundOn) {
    const text = isSoundOn ? 'Game Sound: On' : 'Game Sound: Off';
    const icon = isSoundOn ? 'icon-sound-on' : 'icon-sound-off';
    this.buttonSound.text.text = text;
    this.buttonSound.icon.setTexture(icon);
    this.scene.game.events.emit(isSoundOn ? 'music-on' : 'music-off');
  }

  updateValues({ username, address, avatarURL }) {
    this.username.text = username;
    this.addressText.text = `${address.slice(0, 5)}...${address.slice(-7)}`;
    this.address = address;

    // load avatar
    let loader = new Phaser.Loader.LoaderPlugin(this.scene);
    // ask the LoaderPlugin to load the texture
    loader.image('avatarURL', avatarURL);
    loader.once(Phaser.Loader.Events.COMPLETE, () => this.avatar.setTexture('avatarURL'));
    loader.start();
  }
}

export default PopupSettings;
