import Phaser from 'phaser';

import Popup from './Popup';
import Button from '../button/Button';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';
import { formatter } from '../../../../utils/numbers';

const { width } = configs;

const signUpLink = 'https://www.uncharted.gg';
const learnMoreLink =
  'https://unchartedgg.notion.site/0c461d942f33455e8588c81ab1cd0057?v=b7175561f39a4303b90549bf551be664';

class PopupReferralProgram extends Popup {
  loading = false;
  uPoints = 0;
  template = '';
  referralCode = '';

  constructor(scene, { onOpen, isSimulator, ...configs } = {}) {
    super(scene, 'popup-referral', { title: 'Referral Program', ...configs });
    this.onOpenCallback = onOpen;

    this.events = {
      requestUPointReward: isSimulator ? 'simulator-request-u-point-reward' : 'request-u-point-reward',
      requestTwitterShareTemplate: isSimulator
        ? 'simulator-request-twitter-share-template'
        : 'request-twitter-share-template',
      updateUPointReward: isSimulator ? 'simulator-update-u-point-reward' : 'update-u-point-reward',
      updateTwitterShareTemplate: isSimulator
        ? 'simulator-update-twitter-share-template'
        : 'update-twitter-share-template',
    };

    const leftMargin = this.popup.x - this.popup.width / 2;
    const uPointY = this.popup.y + 80;
    const btnY = uPointY + 270;
    const refCodeContainerY = btnY + 330;

    this.uPointText = scene.add
      .text(this.popup.x + 80, uPointY, '', {
        fontSize: '72px',
        fontFamily: fontFamilies.extraBold,
        color: colors.black,
      })
      .setOrigin(0.5, 0.5);
    this.add(this.uPointText);

    this.signupBtn = new TextButton(
      scene,
      this.popup.x + 220,
      btnY,
      'button-blue-med-short',
      'button-blue-med-short-pressed',
      () => {
        window.open(signUpLink);
      },
      'Sign Up',
      { sound: 'button-1', fontSize: '56px' }
    );
    this.add(this.signupBtn);

    this.refCodeContainer = scene.add.image(width / 2, refCodeContainerY, 'text-container');
    this.add(this.refCodeContainer);

    this.referralText = scene.add
      .text(leftMargin + this.popup.width * 0.4, refCodeContainerY, '', {
        fontSize: fontSizes.extraLarge,
        color: colors.black,
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(0.5, 0.5);
    this.add(this.referralText);
    this.buttonCopy = new Button(
      scene,
      leftMargin + this.popup.width * 0.72,
      refCodeContainerY,
      'button-copy',
      'button-copy-pressed',
      () => navigator.clipboard.writeText(this.referralCode.toUpperCase()),
      { sound: 'button-2' }
    );
    this.add(this.buttonCopy);
    this.buttonTwitter = new Button(
      scene,
      leftMargin + this.popup.width * 0.85,
      refCodeContainerY,
      'button-twitter',
      'button-twitter-pressed',
      () => {
        const text = this.template
          .replace('{referralDiscount}', this.referralDiscount * 100)
          .replace('{referralCode}', this.referralCode.toUpperCase());
        const intentUrl = getTwitterIntentUrl({ text });
        window.open(intentUrl);
      },
      { sound: 'button-2' }
    );
    this.add(this.buttonTwitter);

    const learnMoreText = scene.add
      .text(this.popup.x, this.popup.y + this.popup.height / 2 - 135, 'Learn more', {
        fontSize: '48px',
        fontFamily: fontFamilies.bold,
        color: '#7d2e00',
      })
      .setOrigin(0.5, 0.5)
      .setInteractive()
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
        window.open(learnMoreLink);
      });
    this.add(learnMoreText);

    const underline = scene.add
      .rectangle(this.popup.x, learnMoreText.y + learnMoreText.height / 2 + 5, learnMoreText.width, 4, 0x7d2e00)
      .setOrigin(0.5, 0.5);
    this.add(underline);

    scene.game.events.on(this.events.updateUPointReward, ({ uPointReward }) => {
      this.uPointText.text = formatter.format(uPointReward);
    });

    scene.game.events.on(this.events.updateTwitterShareTemplate, ({ template, referralCode }) => {
      this.template = template;
      this.referralCode = referralCode;
      this.referralText.text = referralCode?.toUpperCase();
      console.log('update-twitter-share-template', { template, referralCode });
    });

    scene.game.events.emit(this.events.requestUPointReward);
    scene.game.events.emit(this.events.requestTwitterShareTemplate);
  }

  onOpen() {
    this.onOpenCallback?.();
  }

  cleanup() {}
}

export default PopupReferralProgram;

const getTwitterIntentUrl = ({ text }) => {
  const intentUrl = new URL('https://twitter.com/intent/tweet');

  const encodedText = text.replace(/(\\n)/g, '\n'); // parse stringified \n into newline character
  intentUrl.searchParams.append('text', encodedText);

  return intentUrl;
};
