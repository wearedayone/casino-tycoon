import Popup from './Popup';
import PopupDepositETH from './PopupDepositETH';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs.json';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';
import Button from '../button/Button';
import { formatter } from '../../../../utils/numbers';

const { width, height } = configs;

class PopupDeposit extends Popup {
  loading = false;
  address = '';

  constructor(scene, parentModal) {
    super(scene, 'popup-small', { title: 'Deposit' });

    // child modals
    this.popupDepositETH = new PopupDepositETH(scene, this);
    scene.add.existing(this.popupDepositETH);

    const x = width * 0.12;
    const imageX = x + width * 0.07;
    const sectionTextX = imageX + width * 0.07;
    const startingY = this.popup.y - this.popup.height / 2;
    const subtitleY = startingY + 150;
    const mainNetContainerY = subtitleY + 320;
    const baseContainerY = mainNetContainerY + 340;
    const balanceTextY = baseContainerY + 180;
    const sectionNameStyle = { fontSize: fontSizes.medium, color: colors.brown, fontFamily: fontFamilies.bold };
    const sectionTitleStyle = { ...sectionNameStyle, color: colors.black };
    const sectionDescriptionStyle = { ...sectionNameStyle, fontSize: fontSizes.small };

    // user details
    const subtitle = scene.add
      .text(width / 2, subtitleY, 'Deposit ETH or NFTs here', {
        fontSize: fontSizes.large,
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0);

    const mainNetName = scene.add.text(x, mainNetContainerY, 'Deposit ETH', sectionNameStyle).setOrigin(0, 3.5);
    const mainNetContainer = scene.add.image(width / 2, mainNetContainerY, 'text-container');
    const mainNetIcon = scene.add.image(imageX, mainNetContainerY, 'icon-eth');
    const mainNetTitle = scene.add
      .text(sectionTextX, mainNetContainerY, 'Deposit on Mainnet', sectionTitleStyle)
      .setOrigin(0, 1.1);
    const mainNetDescription = scene.add
      .text(sectionTextX, mainNetContainerY, 'Layer 1 deposit', sectionDescriptionStyle)
      .setOrigin(0, -0.1);
    const depositButton = new Button(
      scene,
      width * 0.75,
      mainNetContainerY,
      'button-deposit',
      'button-deposit-pressed',
      () => {
        this.close();
        this.popupDepositETH.open();
      }
    );

    const baseName = scene.add
      .text(x, baseContainerY, 'Deposit ETH, Coins or NFTs', sectionNameStyle)
      .setOrigin(0, 3.5);
    const baseContainer = scene.add.image(width / 2, baseContainerY, 'text-container');
    const baseIcon = scene.add.image(imageX, baseContainerY, 'icon-wallet');
    const baseTitle = scene.add
      .text(sectionTextX, baseContainerY, 'Receive on Base', sectionTitleStyle)
      .setOrigin(0, 1.1);
    this.baseDescription = scene.add.text(sectionTextX, baseContainerY, '', sectionDescriptionStyle).setOrigin(0, -0.1);
    const copyButton = new Button(scene, width * 0.82, baseContainerY, 'button-copy', 'button-copy-pressed', () =>
      navigator.clipboard.writeText(this.address)
    );

    const balanceSubtitle = scene.add
      .text(width * 0.15, balanceTextY, 'GangsterArena Wallet Balance: ', sectionDescriptionStyle)
      .setOrigin(0, 0.5);
    this.balanceText = scene.add
      .text(width * 0.58, balanceTextY, '0 ETH', {
        ...sectionDescriptionStyle,
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(0, 0.5);

    const refreshButton = new Button(
      scene,
      width * 0.77,
      balanceTextY,
      'button-refresh',
      'button-refresh-pressed',
      () => {
        if (this.loading) return;
        this.loading = true;
        scene.game.events.emit('refresh-eth-balance');
      }
    );

    this.add(subtitle);
    this.add(mainNetName);
    this.add(mainNetContainer);
    this.add(mainNetIcon);
    this.add(mainNetTitle);
    this.add(mainNetDescription);
    this.add(depositButton);
    this.add(baseName);
    this.add(baseContainer);
    this.add(baseIcon);
    this.add(baseTitle);
    this.add(this.baseDescription);
    this.add(copyButton);
    this.add(balanceSubtitle);
    this.add(this.balanceText);
    this.add(refreshButton);

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

    scene.game.events.on('update-eth-balance', (balance) => {
      this.loading = false;
      this.balanceText.text = `${formatter.format(balance)} ETH`;
    });
  }

  onOpen() {
    this.scene.game.events.emit('request-eth-balance');
  }

  updateAddress(address) {
    this.address = address;
    this.baseDescription.text = `${address.slice(0, 5)}...${address.slice(-9)}`;
  }
}

export default PopupDeposit;
