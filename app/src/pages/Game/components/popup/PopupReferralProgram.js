import Phaser from 'phaser';

import Popup from './Popup';
import Button from '../button/Button';
import { colors, fontFamilies } from '../../../../utils/styles';
import { formatter } from '../../../../utils/numbers';

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

    const btnY = this.popup.y + 670;
    this.signupBtn = new Button(
      scene,
      this.popup.x - 255,
      btnY,
      'button-referral-sign-up',
      'button-referral-sign-up-pressed',
      () => {
        window.open(signUpLink);
      },
      { sound: 'button-1' }
    );
    this.add(this.signupBtn);

    this.shareBtn = new Button(
      scene,
      this.popup.x + 220,
      btnY,
      'button-x-share',
      'button-x-share-pressed',
      () => {
        const text = this.template.replace('{referralCode}', this.referralCode.toUpperCase());
        const intentUrl = getTwitterIntentUrl({ text });
        window.open(intentUrl);
      },
      { sound: 'button-1' }
    );
    this.add(this.shareBtn);

    this.uPointText = scene.add
      .text(this.popup.x + 80, this.popup.y + 95, '', {
        fontSize: '72px',
        fontFamily: fontFamilies.extraBold,
        color: colors.black,
      })
      .setOrigin(0.5, 0.5);
    this.add(this.uPointText);

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
