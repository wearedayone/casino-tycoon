import Popup from './Popup';
import Button from '../button/Button';
import TextInput from '../inputs/TextInput';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';

const { width, height } = configs;
const largeBlackExtraBold = { fontSize: fontSizes.large, color: colors.black, fontFamily: fontFamilies.extraBold };
const mediumBrownBoldCenter = {
  fontSize: fontSizes.medium,
  color: colors.brown,
  fontFamily: fontFamilies.bold,
  align: 'center',
};
const earnedTextStyle = {
  fontSize: '48px',
  color: '#30030B',
  fontFamily: 'WixMadeforDisplayBold',
  align: 'center',
};

class PopupReferralProgram extends Popup {
  loading = false;
  balance = 0;
  code = '';

  constructor(scene, data) {
    super(scene, 'popup-referral', { title: 'Referral Program' });
    const leftMargin = this.popup.x - this.popup.width / 2;
    const startingY = this.popup.y - this.popup.height / 2;
    const walletContainerY = startingY + 1300;
    const earnedTextY = walletContainerY + 180;
    const inviteCodeY = startingY + 600;

    this.referTitle = scene.add
      .text(width / 2, walletContainerY - 420, 'Give --%, Earn --%', largeBlackExtraBold)
      .setOrigin(0.5, 0);
    this.referSubtitle = scene.add
      .text(
        width / 2,
        walletContainerY - 300,
        'Earn --% of all ETH your referral spends. \nYour referrals get --% discount on purchases.',
        mediumBrownBoldCenter
      )
      .setOrigin(0.5, 0);
    this.add(this.referTitle);
    this.add(this.referSubtitle);
    this.walletContainer = scene.add.image(width / 2, walletContainerY, 'text-container');
    this.add(this.walletContainer);

    this.referralText = scene.add
      .text(width / 2, walletContainerY, '', {
        fontSize: fontSizes.extraLarge,
        color: colors.black,
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(0.5, 0.5);
    this.add(this.referralText);
    this.buttonCopy = new Button(
      scene,
      leftMargin + this.popup.width * 0.85,
      walletContainerY,
      'button-copy',
      'button-copy-pressed',
      () => navigator.clipboard.writeText(this.referralCode),
      { sound: 'button-2' }
    );
    this.add(this.buttonCopy);
    this.earnedText = scene.add.text(width / 2, earnedTextY, `ETH earned: 0 ETH`, earnedTextStyle);
    this.earnedText.setOrigin(0.5, 0);
    this.add(this.earnedText);

    this.savedText = scene.add.text(width / 2, earnedTextY + 100, `ETH saved: 0 ETH`, earnedTextStyle);
    this.savedText.setOrigin(0.5, 0);
    this.add(this.savedText);

    this.referralDescription = scene.add
      .text(
        width / 2,
        inviteCodeY - 300,
        'Use code to get --% discount off every \ngangster NFT.',
        mediumBrownBoldCenter
      )
      .setOrigin(0.5, 0);
    this.add(this.referralDescription);
    this.inviteCode = new TextInput(scene, width / 2, inviteCodeY, {
      placeholder: 'Enter referral code',
      textTransform: 'uppercase',
      onChange: (value) => {
        this.buttonPaste.setVisible(Boolean(!value));
        this.buttonApply.setVisible(Boolean(value));
      },
    });
    this.add(this.inviteCode);
    this.status = scene.add.text(width / 2, inviteCodeY + 120, '', mediumBrownBoldCenter).setOrigin(0.5, 0);
    this.add(this.status);

    const buttonX = width / 2 + this.popup.width * 0.35;
    this.buttonPaste = new Button(
      scene,
      buttonX,
      inviteCodeY,
      'button-paste-small',
      'button-paste-small-pressed',
      async () => {
        const text = await navigator.clipboard.readText();
        this.inviteCode.updateValue(text.trim());
      }
    );
    this.buttonApply = new Button(scene, buttonX, inviteCodeY, 'button-check', 'button-check-pressed', async () => {
      this.loading = true;
      this.status.text = 'Checking code... Please wait';
      scene.game.events.emit('apply-invite-code', { code: this.inviteCode.value });
    }).setVisible(false);
    this.codeCheckIcon = scene.add.image(buttonX, inviteCodeY, 'icon-check').setOrigin(0.5, 0.5).setVisible(false);
    this.add(this.buttonPaste);
    this.add(this.buttonApply);
    this.add(this.codeCheckIcon);

    const buttonBack = new TextButton(
      scene,
      width / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue-long-thick',
      'button-blue-long-thick-pressed',
      () => {
        this.close();
      },
      'Continue game',
      { fontSize: '82px', sound: 'close' }
    );

    this.add(buttonBack);

    scene.game.events.on('update-invite-code', ({ code }) => {
      this.code = code;
      this.inviteCode.updateValue(code);
      this.disableApplyCode();
    });
    scene.game.events.on('complete-apply-invite-code', ({ status, message }) => {
      this.loading = false;
      this.status.text = message;
      if (status === 'Success') {
        this.code = this.inviteCode.value.toLowerCase();
        this.disableApplyCode();
      }
    });
    scene.game.events.on('update-referral-config', ({ referralBonus, referralDiscount }) => {
      this.referralDescription.text = `Use code to get ${referralDiscount * 100}% discount off every \ngangster NFT.`;
      this.referTitle.text = `Give ${referralDiscount * 100}%, Earn ${referralBonus * 100}%`;
      this.referSubtitle.text = `Earn ${referralBonus * 100}% of all ETH your referral spends. \nYour referrals get ${
        referralDiscount * 100
      }% discount on purchases.`;
    });
    scene.game.events.on('update-referral-code', (referralCode) => {
      this.referralCode = referralCode;
      this.referralText.text = referralCode?.toUpperCase();
    });
    scene.game.events.emit('request-referral-config');
    scene.game.events.emit('request-invite-code');
  }

  onOpen() {
    this.scene.game.events.emit('request-referral-code');
  }

  disableApplyCode() {
    this.buttonApply.setVisible(false);
    this.buttonPaste.setVisible(false);

    this.codeCheckIcon.setVisible(true);
    this.inviteCode.setDisabled(true);
    this.inviteCode.setTextStyle({ fontFamily: fontFamilies.extraBold, align: 'center' });
  }

  cleanup() {
    // reset form
    if (!this.code) this.inviteCode.updateValue('');
    this.status.text = '';
  }
}

export default PopupReferralProgram;
