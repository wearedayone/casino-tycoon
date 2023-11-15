import Phaser from 'phaser';

import Popup from './Popup';
import Button from '../button/Button';
import configs from '../../configs/configs.json';
import TextButton from '../button/TextButton';

const { width, height } = configs;

class PopupSettings extends Popup {
  address = '';

  constructor(scene) {
    super(scene, 'popup-large', { title: 'Settings' });

    const x = width * 0.08;
    const longBtnX = width / 2;
    const medBtnX = x + width * 0.21;
    const secondMedBtnX = width * 0.71;
    const startingY = this.popup.y - this.popup.height / 2;
    const usernameY = startingY + 150;
    const walletContainerY = usernameY + 210;
    const exportWalletBtnY = walletContainerY + 280;
    const withdrawBtnY = exportWalletBtnY + 280;
    const stakingBtnY = withdrawBtnY + 180;
    const swapBtnY = stakingBtnY + 180;
    const soundBtnY = swapBtnY + 280;
    const creditTextY = soundBtnY + 100;

    // user details
    this.username = scene.add.text(x + 20, usernameY, 'username', {
      fontSize: '60px',
      color: '#29000b',
      fontFamily: 'WixMadeforDisplayExtraBold',
    });
    this.walletContainer = scene.add.image(width / 2, walletContainerY, 'settings-wallet-container');
    this.avatar = scene.add.image(x, walletContainerY, 'avatar');
    this.iconSettings = scene.add.image(x + 200, walletContainerY + 90, 'icon-settings');
    this.myWallet = scene.add.text(x + 300, walletContainerY - 80, 'My Wallet:', {
      fontSize: '60px',
      color: '#29000b',
      fontFamily: 'WixMadeforDisplay',
    });
    this.addressText = scene.add.text(x + 300, walletContainerY, 'address', {
      fontSize: '60px',
      color: '#7d2e00',
      fontFamily: 'WixMadeforDisplay',
    });
    this.buttonCopy = new Button(scene, width * 0.82, walletContainerY, 'button-copy', 'button-copy-pressed', () =>
      navigator.clipboard.writeText(this.address)
    );
    this.buttonExportWallet = new TextButton(
      scene,
      medBtnX,
      exportWalletBtnY,
      'button-blue-med',
      'button-blue-med-pressed',
      () => console.log('export wallet'),
      'Export Wallet'
    );
    this.buttonLogOut = new TextButton(
      scene,
      secondMedBtnX,
      exportWalletBtnY,
      'button-red-med',
      'button-red-med-pressed',
      () => console.log('logout'),
      'Logout',
      { icon: 'icon-logout' }
    );

    this.add(this.username);
    this.add(this.walletContainer);
    this.add(this.avatar);
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
    // .setOrigin(0, 0);
    this.buttonWithdraw = new TextButton(
      scene,
      medBtnX,
      withdrawBtnY,
      'button-blue-med',
      'button-blue-med-pressed',
      () => console.log('withdraw'),
      'Withdraw'
    );
    this.buttonDeposit = new TextButton(
      scene,
      secondMedBtnX,
      withdrawBtnY,
      'button-blue-med',
      'button-blue-med-pressed',
      () => console.log('deposit'),
      'Deposit'
    );
    this.buttonStaking = new TextButton(
      scene,
      longBtnX,
      stakingBtnY,
      'button-blue-long',
      'button-blue-long-pressed',
      () => console.log('staking'),
      'Staking'
    );
    this.buttonSwap = new TextButton(
      scene,
      longBtnX,
      swapBtnY,
      'button-blue-long',
      'button-blue-long-pressed',
      () => console.log('swap'),
      'Swap'
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
      { icon: 'icon-sound-on' }
    );
    this.credit = scene.add.text(width / 2, creditTextY, 'v1.0.0. Gangster Arena. Copyright.', {
      fontSize: '36px',
      color: '#7c2828',
      fontFamily: 'WixMadeforDisplay',
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
      () => this.onClose(),
      'Back',
      { fontSize: '82px' }
    );
    this.add(this.buttonBack);

    scene.game.events.on('game-sound-changed', ({ sound }) => this.updateGameSoundBtn(sound === 'on'));
    scene.game.events.on('update-profile', (data) => this.updateValues(data));
    scene.game.events.emit('request-profile');
  }

  updateGameSoundBtn(isSoundOn) {
    const text = isSoundOn ? 'Game Sound: On' : 'Game Sound: Off';
    const icon = isSoundOn ? 'icon-sound-on' : 'icon-sound-off';
    this.buttonSound.text.text = text;
    this.buttonSound.icon.setTexture(icon);
  }

  updateValues({ username, address, avatarURL }) {
    this.username.text = username;
    this.addressText.text = `${address.slice(0, 5)}...${address.slice(-7)}`;
    this.address = address;
    this.avatar.setTexture(avatarURL);

    // TODO: load avatar
    // scene.game.load.image('avatar', avatarURL);
    // scene.game.load.onLoadComplete.add(() => {
    //   this.avatar.setTexture('avatar');
    // }, this);

    // scene.game.load.start();
  }
}

export default PopupSettings;